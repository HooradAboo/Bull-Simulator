import json

from pydantic import BaseModel

from app.config import settings


class CueOption(BaseModel):
    key: str
    label: str


def load_cue_options() -> list[CueOption]:
    path = settings.cue_options_config_path
    if not path.exists():
        raise FileNotFoundError(f"Cue options config not found: {path}")

    data = json.loads(path.read_text())
    return [CueOption(**item) for item in data]
