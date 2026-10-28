from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MYCOURT_", extra="ignore")

    database_url: str = "postgresql+psycopg://mycourt:mycourt@127.0.0.1:5433/mycourt"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    # Simulated outage, so the front end's error and retry states can be exercised (same CNR as the mock adapter).
    demo_error_cnr: str = "ERROR00000000000"
    seed_on_start: bool = True


settings = Settings()
