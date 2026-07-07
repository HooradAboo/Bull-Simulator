import json

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


def load_public_emails() -> list[EmailPublic]:
    """Same as load_emails() but strips is_phishing before it reaches the client."""
    return [
        EmailPublic(**email.model_dump(exclude={"is_phishing"})) for email in load_emails()
    ]
