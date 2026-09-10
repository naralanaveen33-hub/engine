import os

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        model_config = SettingsConfigDict(env_file=".env", extra="ignore")

        app_name: str = "AquaCrop"
        secret_key: str = "aquacrop-hackathon-change-me"
        access_token_expire_minutes: int = 480
        database_url: str = os.getenv("DATABASE_URL", "postgresql://aquacrop_user:aquacrop_pass@db:5432/aquacrop_db")
        cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174"
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

except ImportError:
    from dataclasses import dataclass

    @dataclass
    class Settings:
        app_name: str = os.getenv("APP_NAME", "AquaCrop")
        secret_key: str = os.getenv("SECRET_KEY", "aquacrop-hackathon-change-me")
        access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
        database_url: str = os.getenv("DATABASE_URL", "postgresql://aquacrop_user:aquacrop_pass@db:5432/aquacrop_db")
        cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174")
        groq_api_key: str = os.getenv("GROQ_API_KEY", "")
        groq_model: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        data_gov_api_key: str = os.getenv("DATA_GOV_API_KEY", "")
        openmeteo_base: str = os.getenv("OPENMETEO_BASE", "https://api.open-meteo.com/v1")
        soilgrids_enabled: bool = True
        hackathon_demo: bool = True
        demo_password: str = os.getenv("DEMO_PASSWORD", "demo1234")
        max_actuator_seconds: int = int(os.getenv("MAX_ACTUATOR_SECONDS", "30"))
        sensor_offline_minutes: int = int(os.getenv("SENSOR_OFFLINE_MINUTES", "10"))
        decision_ttl_minutes: int = int(os.getenv("DECISION_TTL_MINUTES", "120"))

        @property
        def cors_origin_list(self) -> list[str]:
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

