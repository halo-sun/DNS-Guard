from typing import List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.models import AlertModel, DnsEventModel


def get_client_summary(
    db: Session,
    client_ip: str,
) -> dict:
    if not client_ip:
        return {}

    ip = client_ip

    total_queries = (
        db.query(func.count(DnsEventModel.id))
        .filter(DnsEventModel.client_ip == ip)
        .scalar()
        or 0
    )

    if total_queries == 0:
        return {
            "client_ip": ip,
            "query_count": 0,
            "distinct_domains": 0,
            "first_seen_at": None,
            "last_seen_at": None,
            "open_alert_count": 0,
            "highest_severity": None,
            "recent_events": [],
            "top_domains": [],
        }

    first_seen = (
        db.query(DnsEventModel.observed_at)
        .filter(DnsEventModel.client_ip == ip)
        .order_by(DnsEventModel.observed_at.asc())
        .limit(1)
        .scalar()
    )

    last_seen = (
        db.query(DnsEventModel.observed_at)
        .filter(DnsEventModel.client_ip == ip)
        .order_by(DnsEventModel.observed_at.desc())
        .limit(1)
        .scalar()
    )

    distinct_domains = (
        db.query(func.count(func.distinct(DnsEventModel.normalized_domain)))
        .filter(DnsEventModel.client_ip == ip)
        .scalar()
        or 0
    )

    open_alert_count = (
        db.query(func.count(AlertModel.id))
        .filter(
            AlertModel.client_ip == ip,
            AlertModel.status.in_(["new", "investigating", "confirmed", "benign"]),
        )
        .scalar()
        or 0
    )

    severity_rows = (
        db.query(AlertModel.severity, func.count(AlertModel.id))
        .filter(AlertModel.client_ip == ip)
        .group_by(AlertModel.severity)
        .all()
    )

    highest_severity = None
    for sev in ["critical", "high", "medium", "low", "informational"]:
        for s, _ in severity_rows:
            if s == sev:
                highest_severity = sev
                break
        if highest_severity:
            break

    recent_events = (
        db.query(
            DnsEventModel.normalized_domain,
            DnsEventModel.record_type,
            DnsEventModel.observed_at,
            DnsEventModel.response_code,
        )
        .filter(DnsEventModel.client_ip == ip)
        .order_by(DnsEventModel.observed_at.desc())
        .limit(10)
        .all()
    )

    top_domains = (
        db.query(
            DnsEventModel.normalized_domain,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .filter(DnsEventModel.client_ip == ip)
        .group_by(DnsEventModel.normalized_domain)
        .order_by(func.count(DnsEventModel.id).desc())
        .limit(10)
        .all()
    )

    return {
        "client_ip": ip,
        "query_count": total_queries,
        "distinct_domains": distinct_domains,
        "first_seen_at": first_seen,
        "last_seen_at": last_seen,
        "open_alert_count": open_alert_count,
        "highest_severity": highest_severity,
        "recent_events": [
            {
                "domain": row[0],
                "record_type": row[1],
                "observed_at": row[2].isoformat() if row[2] else None,
                "response_code": row[3],
            }
            for row in recent_events
        ],
        "top_domains": [{"domain": row[0], "count": row[1]} for row in top_domains],
    }


def list_clients(
    db: Session,
    *,
    search: str = "",
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """
    Returns (items, total_count).
    Each item includes client_ip, query_count, distinct_domains, open_alert_count,
    highest_severity, last_seen_at.
    """

    client_counts = (
        db.query(
            DnsEventModel.client_ip,
            func.count(DnsEventModel.id).label("cnt"),
            func.max(DnsEventModel.observed_at).label("last_seen"),
        )
        .group_by(DnsEventModel.client_ip)
    )

    if search:
        search_term = f"%{search}%"
        client_counts = client_counts.filter(
            (DnsEventModel.client_ip.ilike(search_term))
        )

    total_count = client_counts.count()

    rows = (
        client_counts.order_by(func.count(DnsEventModel.id).desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for ip, cnt, last_seen in rows:
        distinct_domains = (
            db.query(func.count(func.distinct(DnsEventModel.normalized_domain)))
            .filter(DnsEventModel.client_ip == ip)
            .scalar()
            or 0
        )

        open_alert_count = (
            db.query(func.count(AlertModel.id))
            .filter(
                AlertModel.client_ip == ip,
                AlertModel.status.in_(["new", "investigating", "confirmed", "benign"]),
            )
            .scalar()
            or 0
        )

        severity_rows = (
            db.query(AlertModel.severity, func.count(AlertModel.id))
            .filter(AlertModel.client_ip == ip)
            .group_by(AlertModel.severity)
            .all()
        )

        highest_severity = None
        for sev in ["critical", "high", "medium", "low", "informational"]:
            for s, _ in severity_rows:
                if s == sev:
                    highest_severity = sev
                    break
            if highest_severity:
                break

        items.append(
            {
                "client_ip": ip,
                "query_count": cnt,
                "distinct_domains": distinct_domains,
                "open_alert_count": open_alert_count,
                "highest_severity": highest_severity,
                "last_seen_at": last_seen.isoformat() if last_seen else None,
            }
        )

    return items, total_count
