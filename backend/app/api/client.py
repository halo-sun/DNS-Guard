import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.client_service import list_clients, get_client_summary

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/")
def list_clients_endpoint(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total_count = list_clients(
        db,
        search=search or "",
        limit=page_size,
        offset=(page - 1) * page_size,
    )

    total_pages = max(1, math.ceil(total_count / page_size))

    return {
        "items": items,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
        },
    }


@router.get("/summary/{client_ip}")
def get_client_summary_endpoint(
    client_ip: str,
    db: Session = Depends(get_db),
):
    summary = get_client_summary(db, client_ip)
    if not summary or summary.get("query_count") == 0:
        return summary
    return summary
