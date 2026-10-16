from datetime import datetime, timezone

from fastapi import APIRouter

from ..config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "observe_only": settings.OBSERVE_ONLY,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "sqlite_connected" if "sqlite" in settings.DATABASE_URL else "postgres_connected",
    }
