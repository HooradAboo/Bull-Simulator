import json

from pydantic import BaseModel

from app.config import settings


class ContactProfile(BaseModel):
    firstName: str
    lastName: str
    email: str


class ParticipantProfile(BaseModel):
    netid: str
    firstName: str
    lastName: str
    email: str
    contacts: dict[str, ContactProfile] = {}
    variables: dict[str, str] = {}


def load_participant_profile(netid: str) -> ParticipantProfile | None:
    path = settings.confidential_participants_dir / f"{netid}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    data["netid"] = netid
    return ParticipantProfile(**data)
