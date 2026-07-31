import json

from pydantic import BaseModel

from app.config import settings


class ActionReasonOption(BaseModel):
    key: str
    label: str


def load_action_reasons() -> dict[str, list[ActionReasonOption]]:
    path = settings.action_reasons_config_path
    if not path.exists():
        raise FileNotFoundError(f"Action reasons config not found: {path}")

    data = json.loads(path.read_text())
    return {
        action: [ActionReasonOption(**option) for option in options]
        for action, options in data.items()
    }
