from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    GEMINI_API_KEY: str = ""
    GEMINI_IMAGE_MODEL: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
