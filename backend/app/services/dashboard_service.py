import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.models import AlertModel, DataSourceModel, DnsEventModel
from ..schemas.alert import AlertRead, RuleEvidenceSchema
from ..schemas.dashboard import (
    ActiveClient,
    AnomalySummary,
    DashboardSummaryRead,
    SeverityDistribution,
    TimelinePoint,
    TopDomain,
)


def get_dashboard_summary_data(db: Session) -> DashboardSummaryRead:
    now = datetime.now(timezone.utc)

    total_queries = db.query(func.count(DnsEventModel.id)).scalar() or 0
    unique_clients = db.query(func.count(func.distinct(DnsEventModel.client_ip))).scalar() or 0
    unique_domains = db.query(func.count(func.distinct(DnsEventModel.normalized_domain))).scalar() or 0
    open_alerts = (
        db.query(func.count(AlertModel.id))
        .filter(AlertModel.status.in_(["new", "investigating"]))
        .scalar()
        or 0
    )
    active_sources_count = (
        db.query(func.count(DataSourceModel.id)).filter_by(enabled=True).scalar() or 0
    )

    # NXDOMAIN calculation
    nx_count = (
        db.query(func.count(DnsEventModel.id))
        .filter(DnsEventModel.response_code == "NXDOMAIN")
        .scalar()
        or 0
    )
    nx_rate = round((nx_count / total_queries * 100), 2) if total_queries > 0 else 0.0

    # Severity distribution
    crit_count = db.query(func.count(AlertModel.id)).filter_by(severity="critical").scalar() or 0
    high_count = db.query(func.count(AlertModel.id)).filter_by(severity="high").scalar() or 0
    med_count = db.query(func.count(AlertModel.id)).filter_by(severity="medium").scalar() or 0
    low_count = db.query(func.count(AlertModel.id)).filter_by(severity="low").scalar() or 0

    # Timeline points (hourly buckets over last 6 hours)
    timeline: list[TimelinePoint] = []
    for h in range(6, -1, -1):
        bucket_time = now - timedelta(hours=h)
        bucket_label = bucket_time.strftime("%H:%M")
        start = bucket_time - timedelta(minutes=30)
        end = bucket_time + timedelta(minutes=30)
        q_count = (
            db.query(func.count(DnsEventModel.id))
            .filter(DnsEventModel.observed_at >= start, DnsEventModel.observed_at < end)
            .scalar()
            or 0
        )
        susp_count = (
            db.query(func.count(AlertModel.id))
            .filter(AlertModel.last_seen_at >= start, AlertModel.last_seen_at < end)
            .scalar()
            or 0
        )
        timeline.append(TimelinePoint(timestamp=bucket_label, queries=q_count, suspicious=susp_count))

    # Top queried domains
    top_domains_query = (
        db.query(
            DnsEventModel.normalized_domain,
            DnsEventModel.record_type,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .group_by(DnsEventModel.normalized_domain, DnsEventModel.record_type)
        .order_by(func.count(DnsEventModel.id).desc())
        .limit(5)
        .all()
    )

    top_domains = [
        TopDomain(
            domain=row[0],
            record_type=row[1],
            count=row[2],
            is_suspicious="c2" in row[0] or "tunnel" in row[0] or ".biz" in row[0],
        )
        for row in top_domains_query
    ]

    # Active clients
    active_clients_query = (
        db.query(
            DnsEventModel.client_ip,
            DnsEventModel.client_name,
            func.count(DnsEventModel.id).label("cnt"),
        )
        .group_by(DnsEventModel.client_ip, DnsEventModel.client_name)
        .order_by(func.count(DnsEventModel.id).desc())
        .limit(4)
        .all()
    )

    active_clients = [
        ActiveClient(
            ip=row[0],
            hostname=row[1],
            queries=row[2],
            alerts_count=db.query(func.count(AlertModel.id)).filter_by(client_ip=row[0]).scalar() or 0,
        )
        for row in active_clients_query
    ]

    # Recent alerts
    recent_alerts_models = (
        db.query(AlertModel).order_by(AlertModel.last_seen_at.desc()).limit(5).all()
    )
    recent_alerts: list[AlertRead] = []
    for am in recent_alerts_models:
        evidence_list = []
        try:
            raw_ev = json.loads(am.evidence_json)
            evidence_list = [RuleEvidenceSchema(**item) for item in raw_ev]
        except Exception:
            pass

        recent_alerts.append(
            AlertRead(
                id=am.id,
                grouping_key=am.grouping_key,
                title=am.title,
                category=am.category,
                severity=am.severity,
                risk_score=am.risk_score,
                status=am.status,
                client_ip=am.client_ip,
                normalized_domain=am.normalized_domain,
                first_seen_at=am.first_seen_at,
                last_seen_at=am.last_seen_at,
                related_event_count=am.related_event_count,
                evidence=evidence_list,
                matched_rules=json.loads(am.matched_rules_json or "[]"),
                recommended_actions=json.loads(am.recommended_actions_json or "[]"),
                notes=am.notes,
                is_demo=am.is_demo,
            )
        )

    # Check if database consists of demo data
    demo_count = (
        db.query(func.count(DnsEventModel.id)).filter(DnsEventModel.is_demo.is_(True)).scalar() or 0
    )
    is_demo_mode = demo_count > 0 or total_queries == 0

    return DashboardSummaryRead(
        total_queries=total_queries,
        suspicious_events=crit_count + high_count + med_count,
        open_alerts=open_alerts,
        unique_clients=unique_clients,
        unique_domains=unique_domains,
        active_sources_count=active_sources_count,
        last_updated_at=now,
        nxdomain_rate_percent=nx_rate,
        severity_distribution=SeverityDistribution(
            critical=crit_count, high=high_count, medium=med_count, low=low_count
        ),
        query_volume_timeline=timeline,
        top_queried_domains=top_domains,
        active_clients=active_clients,
        recent_alerts=recent_alerts,
        anomaly_summary=AnomalySummary(
            nxdomain_spikes=1 if nx_count > 5 else 0,
            tunneling_candidates=1 if any("tunnel" in td.domain for td in top_domains) else 0,
            dga_candidates=1 if any(".biz" in td.domain for td in top_domains) else 0,
            entropy_spikes=crit_count,
        ),
        is_demo=is_demo_mode,
    )
