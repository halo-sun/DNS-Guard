import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..collectors.demo_generator import generate_deterministic_demo_batch
from ..db.database import get_db
from ..db.models import DnsEventModel
from ..schemas.common import PaginatedResponse, PaginationMeta
from ..schemas.event import DnsEventRead
from ..services.event_service import ingest_event_batch

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=PaginatedResponse[DnsEventRead])
def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    client_ip: Optional[str] = None,
    domain: Optional[str] = None,
    record_type: Optional[str] = None,
    response_code: Optional[str] = None,
    source_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DnsEventModel)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (DnsEventModel.normalized_domain.ilike(search_term))
            | (DnsEventModel.client_ip.ilike(search_term))
            | (DnsEventModel.record_type.ilike(search_term))
        )
    if client_ip:
        query = query.filter(DnsEventModel.client_ip == client_ip)
    if domain:
        query = query.filter(DnsEventModel.normalized_domain == domain.lower())
    if record_type:
        query = query.filter(DnsEventModel.record_type == record_type.upper())
    if response_code:
        query = query.filter(DnsEventModel.response_code == response_code.upper())
    if source_type:
        query = query.filter(DnsEventModel.source_type == source_type)

    total_count = query.count()
    total_pages = max(1, math.ceil(total_count / page_size))

    items = (
        query.order_by(DnsEventModel.observed_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        items=items,
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
        ),
    )


@router.get("/{event_id}", response_model=DnsEventRead)
def get_event_by_id(event_id: str, db: Session = Depends(get_db)):
    event = db.query(DnsEventModel).filter_by(id=event_id).first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Event {event_id} not found"}},
        )
    return event


@router.post("/ingest/demo")
def trigger_demo_ingest(
    count: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    batch = generate_deterministic_demo_batch(count=count)
    accepted, rejected, duplicates = ingest_event_batch(db, batch)
    return {
        "status": "success",
        "ingested": accepted,
        "rejected": rejected,
        "duplicates": duplicates,
    }
