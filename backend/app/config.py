from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AquaCrop"
    secret_key: str = "aquacrop-hackathon-change-me"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./aquacrop.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    data_gov_api_key: str = ""
    openmeteo_base: str = "https://api.open-meteo.com/v1"
    soilgrids_enabled: bool = True
    hackathon_demo: bool = True
    demo_password: str = "demo1234"
    max_actuator_seconds: int = 30
    sensor_offline_minutes: int = 10
    decision_ttl_minutes: int = 120

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
