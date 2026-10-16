from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .alert import AlertRead


class SeverityDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int


class TimelinePoint(BaseModel):
    timestamp: str
    queries: int
    suspicious: int


class TopDomain(BaseModel):
    domain: str
    count: int
    is_suspicious: bool
    record_type: str


class ActiveClient(BaseModel):
    ip: str
    hostname: Optional[str] = None
    queries: int
    alerts_count: int


class AnomalySummary(BaseModel):
    nxdomain_spikes: int
    tunneling_candidates: int
    dga_candidates: int
    entropy_spikes: int


class DashboardSummaryRead(BaseModel):
    total_queries: int
    suspicious_events: int
    open_alerts: int
    unique_clients: int
    unique_domains: int
    active_sources_count: int
    last_updated_at: datetime
    nxdomain_rate_percent: float
    severity_distribution: SeverityDistribution
    query_volume_timeline: List[TimelinePoint]
    top_queried_domains: List[TopDomain]
    active_clients: List[ActiveClient]
    recent_alerts: List[AlertRead]
    anomaly_summary: AnomalySummary
    is_demo: bool
