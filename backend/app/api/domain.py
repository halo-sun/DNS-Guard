import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..services.domain_service import list_domains, get_domain_summary

router = APIRouter(prefix="/domains", tags=["Domains"])


@router.get("/")
def list_domains_endpoint(
    search: Optional[str] = Query(None),
    min_count: int = Query(1, ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total_count = list_domains(
        db,
        search=search,
        min_count=min_count,
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


@router.get("/summary/{normalized_domain}")
def get_domain_summary_endpoint(
    normalized_domain: str,
    db: Session = Depends(get_db),
):
    summary = get_domain_summary(db, normalized_domain)
    if not summary or summary.get("query_count") == 0:
        return summary
    return summary
