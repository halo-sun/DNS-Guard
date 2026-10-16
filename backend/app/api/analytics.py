import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import AlertModel, DnsEventModel

router = APIRouter(tags=["Analytics & Exports"])


@router.get("/analytics")
def get_analytics_metrics(
    time_range: str = Query("24h", pattern="^(1h|6h|24h|7d)$"),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    delta_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
    }
    start_time = now - delta_map.get(time_range, timedelta(hours=24))

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

    record_types = (
        db.query(DnsEventModel.record_type, func.count(DnsEventModel.id))
        .filter(DnsEventModel.observed_at >= start_time)
        .group_by(DnsEventModel.record_type)
        .all()
    )

    return {
        "time_range": time_range,
        "start_time": start_time.isoformat(),
        "end_time": now.isoformat(),
        "total_queries": total_in_window,
        "nxdomain_count": nxdomain_in_window,
        "record_type_breakdown": {row[0]: row[1] for row in record_types},
    }


@router.get("/exports/events.csv")
def export_events_csv(
    limit: int = Query(1000, le=5000),
    db: Session = Depends(get_db),
):
    events = (
        db.query(DnsEventModel).order_by(DnsEventModel.observed_at.desc()).limit(limit).all()
    )

    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "id",
                "observed_at_utc",
                "client_ip",
                "normalized_domain",
                "record_type",
                "response_code",
                "source_type",
                "fingerprint",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for e in events:
            writer.writerow(
                [
                    e.id,
                    e.observed_at.isoformat(),
                    e.client_ip,
                    e.normalized_domain,
                    e.record_type,
                    e.response_code,
                    e.source_type,
                    e.fingerprint,
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dns_guard_events.csv"},
    )


@router.get("/exports/alerts.csv")
def export_alerts_csv(
    limit: int = Query(500, le=2000),
    db: Session = Depends(get_db),
):
    alerts = db.query(AlertModel).order_by(AlertModel.last_seen_at.desc()).limit(limit).all()

    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "id",
                "title",
                "category",
                "severity",
                "risk_score",
                "status",
                "client_ip",
                "normalized_domain",
                "event_count",
                "last_seen_at_utc",
            ]
        )
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        for a in alerts:
            writer.writerow(
                [
                    a.id,
                    a.title,
                    a.category,
                    a.severity,
                    a.risk_score,
                    a.status,
                    a.client_ip,
                    a.normalized_domain,
                    a.related_event_count,
                    a.last_seen_at.isoformat(),
                ]
            )
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dns_guard_alerts.csv"},
    )
