from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    CANDIDATE_ID: str = "priya.sharma@gmail.com"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/tasks.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
