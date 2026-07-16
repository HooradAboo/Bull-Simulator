"""Export all study data from Postgres to CSV files.

Usage:
    source .venv/bin/activate
    python export_csv.py [output_dir]

If no output_dir is given, writes to exports/<timestamp>/.
"""

import csv
import sys
from datetime import datetime
from pathlib import Path

from app import models
from app.database import SessionLocal
from app.emails import load_emails


def export_table(db, output_dir: Path, filename: str, header: list[str], rows: list[list]):
    path = output_dir / filename
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"  {filename}: {len(rows)} rows")


def export_participants(db, output_dir: Path):
    participants = db.query(models.Participant).order_by(models.Participant.id).all()
    rows = [
        [
            p.id, p.first_name, p.last_name, p.department,
            p.self_efficacy_recognize_links, p.self_efficacy_verify_legitimacy,
            p.self_efficacy_avoid_suspicious, p.self_efficacy_verify_trusted_source,
            p.self_efficacy_report_phishing, p.self_efficacy_recovery_steps,
            p.session_start_ts, p.created_at,
        ]
        for p in participants
    ]
    export_table(
        db, output_dir, "participants.csv",
        [
            "participant_id", "first_name", "last_name", "department",
            "self_efficacy_recognize_links", "self_efficacy_verify_legitimacy",
            "self_efficacy_avoid_suspicious", "self_efficacy_verify_trusted_source",
            "self_efficacy_report_phishing", "self_efficacy_recovery_steps",
            "session_start_ts", "created_at",
        ],
        rows,
    )


def export_email_interactions(db, output_dir: Path):
    emails_by_id = {e.id: e for e in load_emails()}
    interactions = (
        db.query(models.EmailInteraction).order_by(models.EmailInteraction.id).all()
    )
    rows = []
    for i in interactions:
        email_config = emails_by_id.get(i.email_id)
        is_phishing = email_config.is_phishing if email_config else ""
        rows.append([
            i.id, i.participant_id, i.email_id, is_phishing,
            i.opened_at, i.action_taken, i.answer_changed, i.confidence_rating,
            i.time_to_decision_ms, i.confirmed_at, i.recipient, i.created_at,
        ])
    export_table(
        db, output_dir, "email_interactions.csv",
        [
            "interaction_id", "participant_id", "email_id", "is_phishing",
            "opened_at", "action_taken", "answer_changed", "confidence_rating",
            "time_to_decision_ms", "confirmed_at", "recipient", "created_at",
        ],
        rows,
    )


def export_hover_events(db, output_dir: Path):
    events = db.query(models.HoverEvent).order_by(models.HoverEvent.id).all()
    rows = [[e.id, e.interaction_id, e.target, e.start_ts, e.end_ts] for e in events]
    export_table(
        db, output_dir, "hover_events.csv",
        ["id", "interaction_id", "target", "start_ts", "end_ts"],
        rows,
    )


def export_keystroke_events(db, output_dir: Path):
    events = db.query(models.KeystrokeEvent).order_by(models.KeystrokeEvent.id).all()
    rows = [
        [e.id, e.participant_id, e.field_id, e.event_type, e.key, e.timestamp_ms]
        for e in events
    ]
    export_table(
        db, output_dir, "keystroke_events.csv",
        ["id", "participant_id", "field_id", "event_type", "key", "timestamp_ms"],
        rows,
    )


def export_mouse_events(db, output_dir: Path):
    events = db.query(models.MouseEvent).order_by(models.MouseEvent.id).all()
    rows = [
        [e.id, e.participant_id, e.event_type, e.x, e.y, e.target, e.timestamp_ms]
        for e in events
    ]
    export_table(
        db, output_dir, "mouse_events.csv",
        ["id", "participant_id", "event_type", "x", "y", "target", "timestamp_ms"],
        rows,
    )


def export_credentials(db, output_dir: Path):
    credentials = db.query(models.Credential).order_by(models.Credential.id).all()
    rows = [
        [c.id, c.participant_id, c.website, c.email, c.password, c.mfa_enabled, c.created_at, c.updated_at]
        for c in credentials
    ]
    export_table(
        db, output_dir, "credentials.csv",
        ["id", "participant_id", "website", "email", "password", "mfa_enabled", "created_at", "updated_at"],
        rows,
    )


def export_session_events(db, output_dir: Path):
    events = db.query(models.SessionEvent).order_by(models.SessionEvent.id).all()
    rows = [
        [e.id, e.participant_id, e.event_type, e.timestamp_ms, e.event_metadata]
        for e in events
    ]
    export_table(
        db, output_dir, "session_events.csv",
        ["id", "participant_id", "event_type", "timestamp_ms", "event_metadata"],
        rows,
    )


def main():
    if len(sys.argv) > 1:
        output_dir = Path(sys.argv[1])
    else:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        output_dir = Path(__file__).parent / "exports" / timestamp

    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Exporting to {output_dir}/")

    db = SessionLocal()
    try:
        export_participants(db, output_dir)
        export_email_interactions(db, output_dir)
        export_hover_events(db, output_dir)
        export_keystroke_events(db, output_dir)
        export_mouse_events(db, output_dir)
        export_session_events(db, output_dir)
        export_credentials(db, output_dir)
    finally:
        db.close()

    print("Done.")


if __name__ == "__main__":
    main()
