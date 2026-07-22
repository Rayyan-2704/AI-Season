from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GROQ_API_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./Voyage.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()