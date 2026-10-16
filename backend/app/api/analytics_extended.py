from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.analytics_service import analyze_window

router = APIRouter(tags=["Analytics & Exports"])


@router.get("/analytics/extended")
def get_analytics_extended(
    time_range: str = "24h",
    db: Session = Depends(get_db),
):
    """
    Richer analytics aggregation than /analytics:
    - Query volume timeline (hourly buckets)
    - NXDOMAIN timeline
    - Record-type breakdown
    - Response-code breakdown
    - Alert open/closed counts
    - Severity breakdown
    - Top domains and top clients in window

    All values come from persisted DNS events and alerts.
    """
    return analyze_window(db, time_range)
