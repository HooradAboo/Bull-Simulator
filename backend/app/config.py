from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://phishing_study:devpassword@localhost:5432/phishing_study"
    host: str = "127.0.0.1"
    port: int = 8000
    emails_config_dir: Path = REPO_ROOT / "config" / "emails"
    contacts_config_path: Path = REPO_ROOT / "config" / "contacts.json"
    tasks_config_path: Path = REPO_ROOT / "config" / "tasks.json"


settings = Settings()
