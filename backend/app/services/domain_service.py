from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.models import AlertModel, DnsEventModel


def get_domain_summary(
    db: Session,
    normalized_domain: str,
) -> dict:
    if not normalized_domain:
        return {}

    domain = normalized_domain.lower()

    total_queries = (
        db.query(func.count(DnsEventModel.id))
        .filter(DnsEventModel.normalized_domain == domain)
        .scalar()
        or 0
    )

    if total_queries == 0:
        return {
            "normalized_domain": domain,
            "query_count": 0,
            "first_seen_at": None,
            "last_seen_at": None,
            "record_type_breakdown": {},
            "response_code_breakdown": {},
            "client_counts": {},
            "associated_alert_ids": [],
            "associated_alerts": [],
        }

    first_seen = (
        db.query(DnsEventModel.observed_at)
        .filter(DnsEventModel.normalized_domain == domain)
        .order_by(DnsEventModel.observed_at.asc())
        .limit(1)
        .scalar()
    )

    last_seen = (
        db.query(DnsEventModel.observed_at)
        .filter(DnsEventModel.normalized_domain == domain)
        .order_by(DnsEventModel.observed_at.desc())
        .limit(1)
        .scalar()
    )

    record_type_rows = (
        db.query(DnsEventModel.record_type, func.count(DnsEventModel.id))
        .filter(DnsEventModel.normalized_domain == domain)
        .group_by(DnsEventModel.record_type)
        .all()
    )

    response_code_rows = (
        db.query(DnsEventModel.response_code, func.count(DnsEventModel.id))
        .filter(DnsEventModel.normalized_domain == domain)
        .group_by(DnsEventModel.response_code)
        .all()
    )

    client_rows = (
        db.query(
            DnsEventModel.client_ip,
            DnsEventModel.client_name,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .filter(DnsEventModel.normalized_domain == domain)
        .group_by(DnsEventModel.client_ip, DnsEventModel.client_name)
        .order_by(func.count(DnsEventModel.id).desc())
        .all()
    )

    associated_alerts = (
        db.query(AlertModel)
        .filter(AlertModel.normalized_domain == domain)
        .order_by(AlertModel.last_seen_at.desc())
        .limit(25)
        .all()
    )

    return {
        "normalized_domain": domain,
        "query_count": total_queries,
        "first_seen_at": first_seen,
        "last_seen_at": last_seen,
        "record_type_breakdown": {row[0]: row[1] for row in record_type_rows},
        "response_code_breakdown": {row[0]: row[1] for row in response_code_rows},
        "client_counts": [
            {
                "client_ip": row[0],
                "client_name": row[1],
                "query_count": row[2],
            }
            for row in client_rows
        ],
        "associated_alert_ids": [a.id for a in associated_alerts],
        "associated_alerts": [
            {
                "id": a.id,
                "severity": a.severity,
                "risk_score": a.risk_score,
                "status": a.status,
                "title": a.title,
                "category": a.category,
                "client_ip": a.client_ip,
                "first_seen_at": a.first_seen_at.isoformat(),
                "last_seen_at": a.last_seen_at.isoformat(),
                "related_event_count": a.related_event_count,
            }
            for a in associated_alerts
        ],
    }


def list_domains(
    db: Session,
    *,
    search: Optional[str] = None,
    min_count: int = 1,
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """
    Returns (items, total_count).
    Items include domain, query_count, record_types count, last_seen_at.
    Bounded and paginated.
    """
    base = db.query(
        DnsEventModel.normalized_domain,
        func.count(DnsEventModel.id).label("cnt"),
        func.max(DnsEventModel.observed_at).label("last_seen"),
    ).group_by(
        DnsEventModel.normalized_domain,
        DnsEventModel.record_type,
    )

    # For list view, aggregate per domain only.
    # sqlalchemy grouping by normalized_domain alone requires distinct count per domain,
    # so recompute with a subquery-like approach using a second aggregation.
    domain_counts = (
        db.query(
            DnsEventModel.normalized_domain,
            func.count(DnsEventModel.id).label("cnt"),
            func.max(DnsEventModel.observed_at).label("last_seen"),
        )
        .group_by(DnsEventModel.normalized_domain)
    )

    if search:
        search_term = f"%{search.lower()}%"
        domain_counts = domain_counts.filter(
            DnsEventModel.normalized_domain.ilike(search_term)
        )

    total_count = domain_counts.count()

    rows = (
        domain_counts.filter(func.count(DnsEventModel.id) >= min_count)
        .order_by(func.count(DnsEventModel.id).desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for domain, cnt, last_seen in rows:
        record_types_for_domain = (
            db.query(DnsEventModel.record_type, func.count(DnsEventModel.id))
            .filter(DnsEventModel.normalized_domain == domain)
            .group_by(DnsEventModel.record_type)
            .all()
        )
        items.append(
            {
                "domain": domain,
                "query_count": cnt,
                "record_types_count": len(record_types_for_domain),
                "last_seen_at": last_seen.isoformat() if last_seen else None,
                "record_types": [rt[0] for rt in record_types_for_domain],
            }
        )

    return items, total_count
