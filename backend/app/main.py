import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database import engine, Base, get_db
from app.services.demo_seed import seed_demo_data
from app.routers import (
    auth,
    medications,
    medication_logs,
    caregiver,
    health,
    ai,
    emergency,
    dashboard,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo data if empty
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ElderCare AI – Smart Elderly Care & Medication Management Platform API",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS + [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon flexibility & Cloud Run deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for Cloud Run and monitoring
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Reset demo data endpoint for live hackathon presentation
@app.post("/api/demo/reset", tags=["Demo"])
def reset_demo(db: Session = Depends(get_db)):
    """Reset all demo data back to initial clean demonstration state."""
    Base.metadata.create_all(bind=engine)
    seed_demo_data(db, force_reset=True)
    return {"message": "Demo data successfully reset to initial state."}

# Mount routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(medications.router, prefix=settings.API_PREFIX)
app.include_router(medication_logs.router, prefix=settings.API_PREFIX)
app.include_router(caregiver.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(emergency.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)

@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "documentation": "/docs",
        "health": "/api/health",
        "message": "Welcome to ElderCare AI REST API. Access interactive documentation at /docs."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
