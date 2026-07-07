from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://phishing_study:devpassword@localhost:5432/phishing_study"
    host: str = "127.0.0.1"
    port: int = 8000


settings = Settings()
