"""Drives OBS (with Source Record filters on each source) to record the two
webcams and the screen to a per-session folder, anchored to the same
session_start_ts the rest of the app logs against so behavioral events can
be mapped to a video offset later with simple subtraction.

Adapted from the standalone `obs-python.py` lab script: same OBS source
names/camera device paths/Source Record filter convention, but triggered by
the session lifecycle instead of a human running a CLI and pressing Enter.
"""
import json
import re
import subprocess
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import obsws_python as obs

from app.config import settings

SOURCES = ["Cam_Front", "Cam_Below", "Screen"]

DEFAULT_CONTROLS = [  # order matters: disable auto modes before setting manual values
    ("exposure_dynamic_framerate", 0),
    ("auto_exposure", 1),
    ("exposure_time_absolute", 250),
    ("gain", 128),
    ("white_balance_automatic", 0),
    ("white_balance_temperature", 4000),
]

CAMERAS = {
    "Cam_Front": {
        "path": "/dev/v4l/by-id/usb-046d_C505_HD_Webcam_8E340D50-video-index0",
        "controls": DEFAULT_CONTROLS,
    },
    "Cam_Below": {
        "path": "/dev/v4l/by-id/usb-046d_0825_CC6FCBA0-video-index0",
        "controls": DEFAULT_CONTROLS,
    },
}

# Holds the in-progress recording's session dir / start time between the
# start_recording() and stop_recording() calls, which happen on separate
# HTTP requests. A module-level singleton is fine: this app serves one
# participant at a time by design.
_state: dict = {}


class RecordingError(Exception):
    pass


def _now_ns() -> int:
    return time.time_ns()


def _apply_camera_settings() -> dict:
    applied = {}
    for name, cam in CAMERAS.items():
        for ctrl, val in cam["controls"]:
            r = subprocess.run(
                ["v4l2-ctl", "-d", cam["path"], "-c", f"{ctrl}={val}"],
                capture_output=True, text=True,
            )
            if r.returncode != 0:
                print(f"[recording] WARN {name}: could not set {ctrl}={val}: {r.stderr.strip()}")

        names = ",".join(c for c, _ in cam["controls"])
        out = subprocess.run(
            ["v4l2-ctl", "-d", cam["path"], "-C", names], capture_output=True, text=True
        ).stdout
        values = dict(line.split(": ", 1) for line in out.strip().splitlines() if ": " in line)
        applied[name] = values
    return applied


def _connect_req():
    try:
        return obs.ReqClient(
            host=settings.obs_host, port=settings.obs_port, password=settings.obs_password, timeout=10
        )
    except Exception as e:
        raise RecordingError(f"could not connect to OBS at {settings.obs_host}:{settings.obs_port}: {e}")


def _check_obs(cl) -> dict[str, str]:
    """Verify OBS is idle and every source has an enabled Source Record filter.
    Returns {source_name: filter_name}."""
    if cl.get_record_status().output_active:
        raise RecordingError("OBS is already recording")
    filter_names = {}
    for src in SOURCES:
        try:
            filters = cl.get_source_filter_list(src).filters
        except Exception:
            raise RecordingError(f"OBS source '{src}' not found")
        sr = [f for f in filters if "source_record" in f["filterKind"]]
        if not sr:
            raise RecordingError(f"no Source Record filter on '{src}'")
        if not sr[0]["filterEnabled"]:
            raise RecordingError(f"Source Record filter on '{src}' is disabled")
        filter_names[src] = sr[0]["filterName"]
    return filter_names


def _set_output_dirs(cl, session_dir: Path, filter_names: dict[str, str]):
    for src, fname in filter_names.items():
        cl.set_source_filter_settings(src, fname, {"path": str(session_dir)}, True)
    try:
        cl.set_record_directory(str(session_dir))
    except Exception:
        pass


class _RecordEvents:
    """Listens for OBS's own confirmation that recording actually started/stopped."""

    def __init__(self):
        self.started = threading.Event()
        self.stopped = threading.Event()
        self.started_ns: int | None = None
        self.stopped_ns: int | None = None
        self.ec = obs.EventClient(
            host=settings.obs_host, port=settings.obs_port, password=settings.obs_password
        )
        self.ec.callback.register(self.on_record_state_changed)

    def on_record_state_changed(self, data):
        t = _now_ns()
        if data.output_state == "OBS_WEBSOCKET_OUTPUT_STARTED":
            self.started_ns = t
            self.started.set()
        elif data.output_state == "OBS_WEBSOCKET_OUTPUT_STOPPED":
            self.stopped_ns = t
            self.stopped.set()

    def disconnect(self):
        try:
            self.ec.disconnect()
        except Exception:
            pass


def session_dir_name(netid: str, session_start_ts_ms: int) -> str:
    stamp = datetime.fromtimestamp(session_start_ts_ms / 1000, timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{netid}_{stamp}"


def start_recording(netid: str, session_start_ts_ms: int) -> dict:
    """Starts OBS recording into a fresh per-session folder. Raises
    RecordingError on any failure - callers decide whether that should block
    the study session (currently it does not; see main.py)."""
    if not re.fullmatch(r"[A-Za-z0-9_-]+", netid):
        raise RecordingError(f"netid '{netid}' has characters unsafe for a folder name")

    session_dir = settings.recording_base_dir / session_dir_name(netid, session_start_ts_ms)
    session_dir.mkdir(parents=True, exist_ok=True)

    _apply_camera_settings()

    cl = _connect_req()
    filter_names = _check_obs(cl)
    _set_output_dirs(cl, session_dir, filter_names)

    ev = _RecordEvents()
    try:
        cl.start_record()
        if not ev.started.wait(10):
            cl.stop_record()
            raise RecordingError("OBS did not confirm recording start")
    finally:
        ev.disconnect()

    _state.clear()
    _state.update({"session_dir": session_dir, "start_ns": ev.started_ns})

    return {
        "recording_dir": str(session_dir),
        "recording_start_unix_ms": ev.started_ns // 1_000_000,
    }


def _probe(path: Path) -> dict:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate,avg_frame_rate:format=duration",
         "-of", "json", str(path)],
        capture_output=True, text=True,
    )
    try:
        d = json.loads(r.stdout)
        s = d["streams"][0]
        return {
            "resolution": f"{s['width']}x{s['height']}",
            "r_frame_rate": s["r_frame_rate"],
            "avg_frame_rate": s["avg_frame_rate"],
            "duration_s": float(d["format"]["duration"]),
        }
    except Exception:
        return {"error": "ffprobe failed"}


def stop_recording() -> dict:
    if not _state:
        raise RecordingError("no active recording to stop")

    session_dir: Path = _state["session_dir"]
    start_ns: int = _state["start_ns"]

    cl = _connect_req()
    ev = _RecordEvents()
    try:
        resp = cl.stop_record()
        ev.stopped.wait(15)
    finally:
        ev.disconnect()

    stop_ns = ev.stopped_ns or _now_ns()
    time.sleep(3)  # give Source Record time to finalize files

    start_unix_s = start_ns / 1e9
    for p in settings.recording_base_dir.glob("*.mkv"):
        if p.stat().st_mtime >= start_unix_s:
            p.rename(session_dir / p.name)

    # start_record()/stop_record() also produces OBS's own main canvas
    # recording (the 3 per-source filters are configured to key off that
    # call, so it can't be skipped) - it's redundant with the 3 per-source
    # files above, so delete it rather than keep a 4th copy of the session.
    if resp.output_path:
        main_output = Path(resp.output_path)
        if not main_output.exists():
            main_output = session_dir / main_output.name
        if main_output.exists():
            main_output.unlink()

    files = sorted(p for p in session_dir.glob("*.mkv") if p.stat().st_mtime >= start_unix_s)
    result = {
        "recording_dir": str(session_dir),
        "recording_stop_unix_ms": stop_ns // 1_000_000,
        "recording_duration_s": (stop_ns - start_ns) / 1e9,
        "files": {p.name: _probe(p) for p in files},
    }
    _state.clear()
    return result
