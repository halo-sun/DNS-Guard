from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..schemas.dashboard import DashboardSummaryRead
from ..services.dashboard_service import get_dashboard_summary_data

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryRead)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_summary_data(db)
