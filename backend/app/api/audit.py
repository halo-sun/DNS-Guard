import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.audit_service import list_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Append-only audit log, read-only.
    Does not expose secrets or unnecessary personal data beyond what is stored in the audit log.
    """
    result = list_audit_logs(
        db,
        page=page,
        page_size=page_size,
        action=action,
        resource_type=resource_type,
        search=search,
    )

    total_pages = max(1, math.ceil(result["meta"]["total_count"] / result["meta"]["page_size"]))

    return {
        "items": result["items"],
        "meta": {
            "page": result["meta"]["page"],
            "page_size": result["meta"]["page_size"],
            "total_count": result["meta"]["total_count"],
            "total_pages": total_pages,
        },
    }
