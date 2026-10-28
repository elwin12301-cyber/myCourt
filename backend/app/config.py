from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET = "change-me-development-only"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MYCOURT_", extra="ignore")

    database_url: str = "postgresql+psycopg://mycourt:mycourt@127.0.0.1:5433/mycourt"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    # Simulated outage, so the front end's error and retry states can be exercised (same CNR as the mock adapter).
    demo_error_cnr: str = "ERROR00000000000"
    seed_on_start: bool = True

    # Accounts and sessions (spec 004, research D3 to D5)
    secret_key: str = DEFAULT_SECRET
    session_idle_minutes: int = 30
    session_max_hours: int = 12
    login_max_failures: int = 5
    login_window_minutes: int = 15
    cookie_secure: bool = False
    # Requests per minute per client address across the whole API (0 turns the limit off); /health is exempt.
    rate_limit_per_minute: int = 600
    # Addresses allowed to use the operator-only routes (for example deactivating an account).
    operator_emails: list[str] = []

    # Real client data is refused unless this is true AND `check-real-data` passes (research D10).
    allow_real_data: bool = False

    @property
    def mode(self) -> str:
        return "real-data-enabled" if self.allow_real_data else "demonstration-only"


settings = Settings()
