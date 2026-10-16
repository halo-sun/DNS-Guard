from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db.models import AlertModel, DnsEventModel


def _delta_for_range(time_range: str) -> timedelta:
    mapping = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
    }
    return mapping.get(time_range, timedelta(hours=24))


def build_timeline(
    db: Session,
    start_time: datetime,
    now: datetime,
    bucket_minutes: int = 60,
) -> List[Tuple[str, int, int]]:
    """
    Return ordered list of (time_label, queries, nxdomain) buckets from start_time to now.
    Uses fixed UTC clock-hour buckets when bucket_minutes == 60 for stable axis labels.
    """
    results: List[Tuple[str, int, int]] = []

    if bucket_minutes <= 0:
        return results

    current = start_time.replace(minute=0, second=0, microsecond=0)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)

    # Align to whole hours only when using hourly buckets
    while current <= now:
        next_bucket = current + timedelta(minutes=bucket_minutes)
        q_count = (
            db.query(func.count(DnsEventModel.id))
            .filter(
                DnsEventModel.observed_at >= current,
                DnsEventModel.observed_at < next_bucket,
            )
            .scalar()
            or 0
        )
        nx_count = (
            db.query(func.count(DnsEventModel.id))
            .filter(
                DnsEventModel.observed_at >= current,
                DnsEventModel.observed_at < next_bucket,
                DnsEventModel.response_code == "NXDOMAIN",
            )
            .scalar()
            or 0
        )
        results.append(
            (current.strftime("%H:%M"), q_count, nx_count)
        )
        current = next_bucket

    return results


def analyze_window(
    db: Session,
    time_range: str,
) -> Dict:
    now = datetime.now(timezone.utc)
    start_time = now - _delta_for_range(time_range)

    total_in_window = (
        db.query(func.count(DnsEventModel.id))
        .filter(DnsEventModel.observed_at >= start_time)
        .scalar()
        or 0
    )

    nxdomain_in_window = (
        db.query(func.count(DnsEventModel.id))
        .filter(
            DnsEventModel.observed_at >= start_time,
            DnsEventModel.response_code == "NXDOMAIN",
        )
        .scalar()
        or 0
    )

    alert_open_in_window = (
        db.query(func.count(AlertModel.id))
        .filter(
            AlertModel.last_seen_at >= start_time,
            AlertModel.status.in_(["new", "investigating", "confirmed", "benign"]),
        )
        .scalar()
        or 0
    )

    alert_closed_in_window = (
        db.query(func.count(AlertModel.id))
        .filter(
            AlertModel.last_seen_at >= start_time,
            AlertModel.status == "closed",
        )
        .scalar()
        or 0
    )

    record_types = (
        db.query(DnsEventModel.record_type, func.count(DnsEventModel.id))
        .filter(DnsEventModel.observed_at >= start_time)
        .group_by(DnsEventModel.record_type)
        .all()
    )

    response_codes = (
        db.query(DnsEventModel.response_code, func.count(DnsEventModel.id))
        .filter(DnsEventModel.observed_at >= start_time)
        .group_by(DnsEventModel.response_code)
        .all()
    )

    severity_breakdown = (
        db.query(AlertModel.severity, func.count(AlertModel.id))
        .filter(AlertModel.last_seen_at >= start_time)
        .group_by(AlertModel.severity)
        .all()
    )

    timeline = build_timeline(db, start_time, now, bucket_minutes=60)

    # Top domains in window
    top_domains = (
        db.query(
            DnsEventModel.normalized_domain,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .filter(DnsEventModel.observed_at >= start_time)
        .group_by(DnsEventModel.normalized_domain)
        .order_by(func.count(DnsEventModel.id).desc())
        .limit(10)
        .all()
    )

    # Top clients in window
    top_clients = (
        db.query(
            DnsEventModel.client_ip,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .filter(DnsEventModel.observed_at >= start_time)
        .group_by(DnsEventModel.client_ip)
        .order_by(func.count(DnsEventModel.id).desc())
        .limit(10)
        .all()
    )

    return {
        "time_range": time_range,
        "start_time": start_time.isoformat(),
        "end_time": now.isoformat(),
        "total_queries": total_in_window,
        "nxdomain_count": nxdomain_in_window,
        "record_type_breakdown": {row[0]: row[1] for row in record_types},
        "response_code_breakdown": {row[0]: row[1] for row in response_codes},
        "alert_open_count": alert_open_in_window,
        "alert_closed_count": alert_closed_in_window,
        "severity_breakdown": {row[0]: row[1] for row in severity_breakdown},
        "query_volume_timeline": [
            {"timestamp": label, "queries": q, "nxdomain": nx}
            for label, q, nx in timeline
        ],
        "top_domains": [{"domain": row[0], "count": row[1]} for row in top_domains],
        "top_clients": [{"client_ip": row[0], "count": row[1]} for row in top_clients],
    }
