import json

from pydantic import BaseModel

from app.config import settings


class Contact(BaseModel):
    name: str
    email: str


def load_contacts() -> list[Contact]:
    path = settings.contacts_config_path
    if not path.exists():
        raise FileNotFoundError(f"Contacts config not found: {path}")

    data = json.loads(path.read_text())
    return [Contact(**item) for item in data]


def load_contacts_for_participant(profile) -> list[Contact]:
    """Static shared contacts plus this participant's own contacts (advisor,
    friend, supervisor, peer, ...), so the address book is unique per
    participant.
    """
    contacts = load_contacts()
    if profile:
        for contact in profile.contacts.values():
            contacts.append(
                Contact(name=f"{contact.firstName} {contact.lastName}", email=contact.email)
            )
    return contacts
