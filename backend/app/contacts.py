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
