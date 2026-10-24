import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediChronicle AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Supports SQLite by default for zero-friction local tests, or PostgreSQL in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medichronicle.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medichronicle-super-secure-production-secret-key-32bytes!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath("./uploads"))
    EXPORT_DIR: str = os.getenv("EXPORT_DIR", os.path.abspath("./exports"))
    
    # External Services Simulation Flags
    SIMULATE_INTERACTION_OUTAGE: bool = False
    
    # CORS: Comma-separated list of allowed origins, or * for all
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EXPORT_DIR, exist_ok=True)
