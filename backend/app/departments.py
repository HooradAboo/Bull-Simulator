import json

from pydantic import BaseModel

from app.config import settings


class DepartmentConfig(BaseModel):
    department: str
    advisor_name: str
    advisor_email: str


def load_departments() -> list[DepartmentConfig]:
    path = settings.departments_config_path
    if not path.exists():
        raise FileNotFoundError(f"Departments config not found: {path}")

    data = json.loads(path.read_text())
    return [DepartmentConfig(**item) for item in data]


def get_department(department: str) -> DepartmentConfig | None:
    for entry in load_departments():
        if entry.department == department:
            return entry
    return None


def personal_lookalike_email(advisor_name: str) -> str:
    """Derives a plausible-looking but fake personal email from an advisor's
    name, e.g. "Dr. Elena Ruiz" -> "elena.ruiz99@outlook.com" - used by the
    phishing email that impersonates the same advisor from a mismatched
    personal domain instead of their real usf.edu address.
    """
    parts = [p.lower() for p in advisor_name.replace(".", "").split() if p.lower() != "dr"]
    return f"{'.'.join(parts)}99@outlook.com"
