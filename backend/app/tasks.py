import json

from pydantic import BaseModel

from app.config import settings


class Subtask(BaseModel):
    id: str
    label: str
    type: str
    action: str | None = None


class TaskConfig(BaseModel):
    id: str
    title: str
    subtasks: list[Subtask]


def load_tasks() -> list[TaskConfig]:
    path = settings.tasks_config_path
    if not path.exists():
        raise FileNotFoundError(f"Tasks config not found: {path}")

    data = json.loads(path.read_text())
    return [TaskConfig(**item) for item in data]
