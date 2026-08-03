from fastapi import APIRouter
from app.schemas.lead import HealthResponse
from app.core.config import settings


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.app_env,
    )