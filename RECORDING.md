# Recording Setup (OBS + Cameras)

How video is captured during a session: two webcams (front and below) plus
the screen, each recorded as its own file via OBS's Source Record filter.

This doc has two parts:

- **Part 1** — the commands to run before every session.
- **Part 2** — the full setup, for replicating this configuration from
  scratch on a new machine (OBS config, camera/lab context, etc.).

The app itself (`backend/app/recording.py`) only starts/stops OBS's main
recording over the websocket API and sorts the resulting files into a
per-session folder — it does **not** touch camera settings. Everything
below is done manually.

## Part 1: Before each session

Put each camera where it will stay, turn the lights on as they will be
during the session, and sit someone in the seat — then run both of these
before opening the app.

**Front:**

```bash
CAM=/dev/v4l/by-id/usb-046d_Logitech_BRIO_2F7E54B1-video-index0
v4l2-ctl -d $CAM -c auto_exposure=1 -c exposure_dynamic_framerate=0 \
  -c exposure_time_absolute=166 -c gain=0 -c white_balance_automatic=0 \
  -c focus_automatic_continuous=0 -c backlight_compensation=0
v4l2-ctl -d $CAM -c zoom_absolute=190 -c focus_absolute=40 \
  -c white_balance_temperature=3500
```

**Below:**

```bash
CAM=/dev/v4l/by-id/usb-046d_Logitech_BRIO_F36C01B9-video-index0
v4l2-ctl -d $CAM -c auto_exposure=1 -c exposure_dynamic_framerate=0 \
  -c exposure_time_absolute=166 -c gain=0 -c white_balance_automatic=0 \
  -c focus_automatic_continuous=0 -c backlight_compensation=0
v4l2-ctl -d $CAM -c zoom_absolute=250 -c focus_absolute=40 \
  -c white_balance_temperature=3500
```

Run the first line of each pair before the second — it disables the
camera's automatic modes, which must happen before the manual values are
set or they get overridden.

**Check it stuck**, for either camera:

```bash
v4l2-ctl -d $CAM --get-ctrl=auto_exposure,exposure_time_absolute,gain,zoom_absolute,focus_absolute,white_balance_temperature
```

**Also confirm:**
- The old C505 test webcam (if present) is unplugged.
- OBS is open, idle (not already recording), and all three sources
  (`Cam_Front`, `Cam_Below`, `Screen`) still have their Source Record
  filter enabled — the app checks this itself on session start and logs a
  non-fatal error if not, but it's worth a glance.

That's it — the app handles starting/stopping the actual recording.

If the camera position, lighting, or seat changes, don't just rerun the
commands above with the same numbers — re-tune first (see "Re-tuning" in
Part 2) and update this file with the new values.

## Part 2: Full setup (replicating this from scratch)

### Cameras and lab setup

- **Cameras:** two Logitech Brio webcams, one mounted as the **front** view
  (face-on) and one as the **below** view (e.g. hands/keyboard or a lower
  angle), both on USB 3.0.
- **Screen:** captured separately via OBS's PipeWire screen capture, not a
  physical camera.
- **Resolution/frame rate:** all three recordings run at 1920x1080 @ 30fps,
  matching the OBS canvas.
- **Lights:** Neewer lights; `white_balance_temperature` should be set to
  match whatever color temperature they're actually set to (see
  "Re-tuning" below).

### 1. Confirm both cameras are on USB 3

```bash
lsusb -t
```

Find the two `Class=Video` devices and check the speed at the end of the
line (`5000M`/`10000M` = USB 3, good; `480M` = USB 2, move it to a blue/SS
port with the original USB 3 cable and re-check). On USB 2 the Brios can't
reliably carry uncompressed 1080p30, and two of them would share a slow bus.

### 2. Identify each camera's device path

```bash
ls -l /dev/v4l/by-id/ | grep index0
```

Current cameras:

| Position | Serial | Device path |
|---|---|---|
| Front | `2F7E54B1` | `/dev/v4l/by-id/usb-046d_Logitech_BRIO_2F7E54B1-video-index0` |
| Below | `F36C01B9` | `/dev/v4l/by-id/usb-046d_Logitech_BRIO_F36C01B9-video-index0` |

Never pick `/dev/video1`–`3` or `5`–`7` directly — those are extra
interfaces, not the capture node. Use the `by-id` symlinks above instead;
they resolve to the correct `/dev/videoN` regardless of USB port/reboot
order.

### 3. Lock each camera's controls

Same two command pairs as Part 1 (that's all this step is — Part 1 is this
step, repeated before every session).

### 4. Re-tuning

If the camera position, lighting, or seat changes, re-tune while watching
the OBS preview:

- `zoom_absolute` (100 = no zoom) — try values until you see head and
  shoulders.
- `focus_absolute` (0–100) — try values until the face is sharp.
- `white_balance_temperature` — match the room's lights, or start at
  5000 and adjust until skin tone looks natural.

Everything else in the two commands (`exposure_time_absolute=166`,
`gain=0`, etc.) is room-wide, not position-dependent, and shouldn't need
retuning unless the lighting setup itself changes. Once re-tuned, update
the values in Part 1 above so the next session uses the new numbers.

### 5. OBS settings

OBS 33.0.0. This is one-time setup per machine; once configured, the
sources and filters persist across sessions.

#### Settings → Video

| Setting | Value |
|---|---|
| Base (Canvas) resolution | Participant monitor's native resolution (check with `xrandr \| grep -E " connected\|\*"`, or Settings → Displays under Wayland) |
| Output (Scaled) resolution | Same as base (Downscale Filter should read "Resolutions match, no downscaling required") |
| FPS | 30 (Common FPS Values) |

#### Settings → Advanced → Video

| Setting | Value | Why |
|---|---|---|
| Color format | NV12 | Standard format, handled by all decoders |
| Color space | Rec. 709 | Standard for HD |
| Color range | Limited | Full range is often misread by OpenCV/ffmpeg, giving washed-out or crushed colors |

Leave everything else in Settings/Advanced untouched.

#### Settings → Output (Output Mode: Advanced) → Recording tab

This is the main/composite recording — a low-quality backup file, not one
of the three real per-source recordings (those come from the Source Record
filters below).

| Setting | Value | Why |
|---|---|---|
| Type | Standard | Plain file recording |
| Recording Path | Your output folder | Source Record writes its own files elsewhere; this only holds the composite file |
| Recording Format | Matroska (.mkv) | Survives crashes; remux to mp4 later if needed |
| Video Encoder | x264 | Keeps the GPU free for the three real streams (this file isn't used) |
| Audio Track | Track 1 only | Source Record handles Tracks 2 and 3 |
| Rescale Output | Off | |
| Rate Control | CRF | Constant quality |
| CRF | 30–35 | Smaller, lower-quality file is fine - this file is discarded by the app after each session |
| CPU Usage Preset | veryfast | Keeps CPU load low |

Leave the Streaming tab alone.

#### Sources

1. **Screen** — `+` → Screen Capture (PipeWire), name it `Screen`.
2. **Cam_Front** and **Cam_Below** — `+` → Video Capture Device (V4L2) for
   each, named exactly `Cam_Front` / `Cam_Below` (the backend's
   `app/recording.py` looks up OBS sources by these exact names).

   | Setting | Value | Why |
   |---|---|---|
   | Device | The `/dev/videoN` node matching the `by-id` path above | Never video1–3/5–7, those are extra interfaces |
   | Video Format | YUYV (uncompressed); MJPEG as fallback | Brios list YUYV at 1080p30; switch to MJPEG only if frames drop |
   | Resolution | 1920x1080 | Enough face detail once zoomed to head/shoulders |
   | Frame Rate | 30 | Matches the canvas |
   | Color Range | Default | A wrong manual choice gives washed-out/crushed blacks |

#### Source Record filter (on each of the 3 sources)

Right-click the source → Filters → `+` under Effect Filters → Source Record.

| Setting | Value | Why |
|---|---|---|
| Record Mode | Recording | Starts/stops with the main OBS recording, so the app controls everything via one `start_record`/`stop_record` call |
| Path | Session folder (set per-session by the app, see below) | |
| Filename Formatting | `Webcam_%CCYY-%MM-%DD_%hh-%mm-%ss` (or similar, prefixed by source name) | Keeps files identifiable |
| Format | mkv | Survives a crash |
| Audio Track | That source's own track (see Audio below) | |
| Scale | Off | Record at native size |
| Video Encoder | NVIDIA NVENC H.264 | GPU encoding; H.264 opens in any analysis tool |
| Audio Encoder | AAC, 128 kbps | Audio is only for sync, quality doesn't matter |

The app (`start_recording()` in `backend/app/recording.py`) overwrites each
filter's `Path` to that session's folder right before starting, so the
"Path" set manually here is just a placeholder/default.

**NVENC H.264 encoder options** (appear after selecting the video encoder):

| Setting | Value | Why |
|---|---|---|
| Rate Control | CQP | Constant quality per frame |
| CQ Level | 18 | Lower = better quality/bigger files; 18 suits faces |
| Keyframe Interval | 1 s | Easy to jump to exact frames later |
| Preset | P5 or P6 | Better compression at small GPU cost |
| Tuning | High Quality | Favors quality over speed |
| Multipass | Single pass | Little benefit at CQP |
| Profile | high | Best compression, universally supported |
| Look-ahead | Off | Not needed with CQP |
| Adaptive Quantization | Off | Keeps quality behavior predictable across scenes |
| B-frames | 0 | Keeps frame timestamps simple/reliable |
| Custom encoder options | Leave empty | |

#### Settings → Audio

| Setting | Value | Why |
|---|---|---|
| Channel | Stereo | Brio mics are stereo; audio is sync-only so mono wouldn't save much |
| Sample Rate | 48 kHz | OBS default |
| Desktop Audio (global) | Disabled | Added as its own source instead, to avoid double-recording |
| Mic/Auxiliary Audio (global) | Disabled | Mics come in as per-source audio inputs instead |

**Audio sources** (`+` under Sources):

| Source type | Name | Device |
|---|---|---|
| Audio Output Capture | Desktop Audio | Default output device |
| Audio Input Capture | Webcam Mic (Front) | Front Brio's PulseAudio/PipeWire mic entry (not ALSA) — tap the mic to tell the two Brios apart, since they may show identical names |
| Audio Input Capture | Webcam Mic (Below) | Below Brio's mic, same caveat |

**Track assignment** (Audio Mixer → gear icon → Advanced Audio Properties):

| Recording | Audio source | Track |
|---|---|---|
| Screen | Desktop Audio | Track 1 only |
| Cam_Front | Front webcam's mic | Track 2 only |
| Cam_Below | Below webcam's mic | Track 3 only |

Leave Audio Monitoring off.

**Sync beep:** the app plays a short beep through the speakers right after
confirming the recording started (see `playSyncClap()` in the frontend and
the 1.5s wait in `App.tsx`'s `handleBegin`) — this is picked up by Desktop
Audio for the screen file and by each webcam's own mic, giving a shared
reference point to align all three files afterward. This only works if the
beep is actually audible in the room.

### 6. Verifying the full pipeline

1. Confirm OBS is idle (not already recording) and all three sources have
   an **enabled** Source Record filter — the app checks this itself and
   raises a `RecordingError` (logged, non-fatal — the study session still
   proceeds) if not.
2. Start a session from the app; it calls `start_record()` over the OBS
   websocket and waits for OBS's own confirmation event.
3. End the session; the app calls `stop_record()`, waits for confirmation,
   moves each Source Record `.mkv` into the session folder, and deletes the
   redundant main/composite recording.
4. Check `backend/app/recording.py`'s `session_dir_name()` for the folder
   naming convention (`<netid>_<UTC timestamp>`), under
   `settings.recording_base_dir`.
