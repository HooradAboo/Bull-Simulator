import json
from datetime import datetime

from pydantic import BaseModel

from app.config import settings


class EmailConfig(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    link: str | None = None
    attachment: str | None = None
    is_phishing: bool


class EmailPublic(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    link: str | None = None
    attachment: str | None = None


def load_emails() -> list[EmailConfig]:
    """Load and validate every *.json file in config/emails/.

    Includes is_phishing ground truth. Used server-side only (backend
    logging joins, CSV export) - never sent to the frontend.
    """
    emails_dir = settings.emails_config_dir
    if not emails_dir.exists():
        raise FileNotFoundError(f"Email config directory not found: {emails_dir}")

    emails = []
    for path in sorted(emails_dir.glob("*.json")):
        data = json.loads(path.read_text())
        emails.append(EmailConfig(**data))

    if not emails:
        raise ValueError(f"No email config files found in {emails_dir}")

    return emails


def format_login_time(session_start_ts: int) -> str:
    """session_start_ts is epoch milliseconds."""
    dt = datetime.fromtimestamp(session_start_ts / 1000)
    return dt.strftime("%B %-d, %Y at %-I:%M %p")


def build_template_context(first_name: str, last_name: str, session_start_ts: int) -> dict[str, str]:
    return {
        "first_name": first_name,
        "last_name": last_name,
        "participant_name": f"{first_name} {last_name}",
        "login_time": format_login_time(session_start_ts),
    }


def render_template(text: str, context: dict[str, str]) -> str:
    """Replaces {{key}} placeholders. Emails with no placeholders are unaffected."""
    for key, value in context.items():
        text = text.replace("{{" + key + "}}", value)
    return text


def load_public_emails(context: dict[str, str] | None = None) -> list[EmailPublic]:
    """Same as load_emails() but strips is_phishing before it reaches the client.

    When context is given, {{participant_name}}/{{login_time}}-style
    placeholders in subject/body are filled in - most emails don't have any
    and pass through unchanged.
    """
    result = []
    for email in load_emails():
        data = email.model_dump(exclude={"is_phishing"})
        if context:
            data["subject"] = render_template(data["subject"], context)
            data["body"] = render_template(data["body"], context)
        result.append(EmailPublic(**data))
    return result
