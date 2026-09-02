import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
BACKUPS_DIR = BASE_DIR / "backups"
BACKUPS_DIR.mkdir(exist_ok=True)

# Supabase PostgreSQL connection defaults
DEFAULT_POSTGRES_ASYNC_URL = (
    "postgresql+asyncpg://postgres.pemjwprezimbzmgeduoj:KjXWremtSKCxtcl6"
    "@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
)
DEFAULT_POSTGRES_SYNC_URL = (
    "postgresql+psycopg2://postgres.pemjwprezimbzmgeduoj:KjXWremtSKCxtcl6"
    "@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
)

class Settings(BaseSettings):
    PROJECT_NAME: str = "KDP Intelligence Studio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Primary Database (Supabase PostgreSQL by default, with SQLite fallback)
    USE_POSTGRES: bool = True
    POSTGRES_URL: str = DEFAULT_POSTGRES_ASYNC_URL
    POSTGRES_SYNC_URL: str = DEFAULT_POSTGRES_SYNC_URL
    
    DATABASE_URL: str = DEFAULT_POSTGRES_ASYNC_URL
    SYNC_DATABASE_URL: str = DEFAULT_POSTGRES_SYNC_URL
    
    # Amazon PA-API Credentials (Optional - configured via UI/env)
    AMAZON_ACCESS_KEY: Optional[str] = None
    AMAZON_SECRET_KEY: Optional[str] = None
    AMAZON_ASSOCIATE_TAG: Optional[str] = None
    AMAZON_DEFAULT_MARKETPLACE: str = "US"
    
    # Local AI (Ollama / OpenAI-compatible)
    AI_PROVIDER: str = "ollama" # "ollama" | "openai" | "custom"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3:latest"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE_AMAZON: int = 15
    REQUEST_TIMEOUT_SECONDS: int = 20
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
