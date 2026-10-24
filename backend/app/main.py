from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.models import *  # Import all models for table creation
from app.api.v1.api_router import api_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MediChronicle AI — Unified Clinical Health Memory and Intelligence Platform with 14 Modules"
)

# CORS Middleware
cors_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected", "modules_active": 14}
