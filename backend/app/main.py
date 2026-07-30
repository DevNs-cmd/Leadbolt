from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import health, leads


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    description="LeadBolt - AI Revenue & Sales Operating System",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(leads.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {
        "message": "Welcome to LeadBolt API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }