"""Re-export leads router for backward compatibility."""
from app.api.routes.leads import router

__all__ = ["router"]
