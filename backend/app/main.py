from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.models import lead as lead_models  # noqa: F401
from app.routers import analytics, leads, qualification


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT != "production":
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI Revenue & Sales Operating System - Lead Scoring & AI Qualification",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router, prefix=settings.API_V1_PREFIX)
app.include_router(qualification.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/", tags=["system"])
def root():
    return {
        "service": settings.APP_NAME,
        "docs": "/docs",
        "health": "/health",
    }
