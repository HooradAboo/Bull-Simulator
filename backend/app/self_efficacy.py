import json

from pydantic import BaseModel

from app.config import settings


class SelfEfficacyQuestion(BaseModel):
    key: str
    text: str


def load_self_efficacy_questions() -> list[SelfEfficacyQuestion]:
    path = settings.self_efficacy_questions_config_path
    if not path.exists():
        raise FileNotFoundError(f"Self-efficacy questions config not found: {path}")

    data = json.loads(path.read_text())
    return [SelfEfficacyQuestion(**item) for item in data]
