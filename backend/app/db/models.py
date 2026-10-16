import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="analyst", nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class DnsEventModel(Base):
    __tablename__ = "dns_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ingested_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    client_ip = Column(String(64), nullable=False, index=True)
    client_name = Column(String(255), nullable=True)
    original_domain = Column(String(512), nullable=False)
    normalized_domain = Column(String(512), nullable=False, index=True)
    record_type = Column(String(16), nullable=False, index=True)
    response_code = Column(String(32), nullable=False, index=True)
    response_details = Column(Text, nullable=True)
    resolver_id = Column(String(64), nullable=True)
    protocol = Column(String(16), default="UDP", nullable=False)
    source_id = Column(String(64), nullable=False, index=True)
    source_type = Column(String(32), default="sensor", nullable=False)
    query_size = Column(Integer, nullable=True)
    response_size = Column(Integer, nullable=True)
    duration_ms = Column(Float, nullable=True)
    fingerprint = Column(String(64), nullable=False, index=True)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)

    __table_args__ = (
        Index("ix_dns_events_observed_client", "observed_at", "client_ip"),
        Index("ix_dns_events_observed_domain", "observed_at", "normalized_domain"),
    )


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    grouping_key = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    status = Column(String(32), default="new", nullable=False, index=True)
    client_ip = Column(String(64), nullable=False, index=True)
    normalized_domain = Column(String(512), nullable=False, index=True)
    first_seen_at = Column(DateTime(timezone=True), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=False, index=True)
    related_event_count = Column(Integer, default=1, nullable=False)
    evidence_json = Column(Text, nullable=False, default="[]")
    matched_rules_json = Column(Text, nullable=False, default="[]")
    recommended_actions_json = Column(Text, nullable=False, default="[]")
    notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)


class DetectionRuleModel(Base):
    __tablename__ = "detection_rules"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    rule_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    contribution = Column(Integer, nullable=False)
    threshold_json = Column(Text, nullable=False, default="{}")
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class DataSourceModel(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    type = Column(String(32), nullable=False)
    name = Column(String(255), nullable=False)
    config_metadata_json = Column(Text, nullable=True, default="{}")
    enabled = Column(Boolean, default=True, nullable=False)
    health_status = Column(String(32), default="healthy", nullable=False)
    last_event_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    event_count = Column(Integer, default=0, nullable=False)


class AllowlistEntryModel(Base):
    __tablename__ = "allowlist_entries"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    pattern = Column(String(512), nullable=False, index=True)
    kind = Column(String(32), default="domain", nullable=False)
    reason = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    created_by = Column(String(64), default="system", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(128), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class ImportModel(Base):
    __tablename__ = "imports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    source_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    status = Column(String(32), default="completed", nullable=False)
    accepted_count = Column(Integer, default=0, nullable=False)
    rejected_count = Column(Integer, default=0, nullable=False)
    duplicate_count = Column(Integer, default=0, nullable=False)
    errors_json = Column(Text, nullable=True, default="[]")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
