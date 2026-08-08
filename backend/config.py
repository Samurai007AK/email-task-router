from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = ""  # optional pin; empty = auto-fallback chain
    # Ollama Cloud (OpenAI-compatible). If OLLAMA_API_KEY is set, Ollama is
    # tried FIRST for classification + chat phrasing; Gemini is the fallback.
    OLLAMA_API_KEY: str = ""
    OLLAMA_MODEL: str = ""  # empty = gemma4:31b
    OLLAMA_BASE_URL: str = "https://ollama.com/v1"
    CANDIDATE_ID: str = "arijitkonar16@gmail.com"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/tasks.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://email-task-router-one.vercel.app",
    ]

    class Config:
        env_file = ".env"

settings = Settings()
