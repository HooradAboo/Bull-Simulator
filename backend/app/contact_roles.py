import json

from pydantic import BaseModel

from app.config import settings


class ContactRole(BaseModel):
    key: str
    label: str


def load_contact_roles() -> list[ContactRole]:
    path = settings.contact_roles_config_path
    if not path.exists():
        raise FileNotFoundError(f"Contact roles config not found: {path}")

    data = json.loads(path.read_text())
    return [ContactRole(**item) for item in data]
