from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DnsEventBase(BaseModel):
    observed_at: datetime
    client_ip: str
    client_name: Optional[str] = None
    original_domain: str
    normalized_domain: str
    record_type: str = Field(..., max_length=16)
    response_code: str = Field(..., max_length=32)
    response_details: Optional[str] = None
    resolver_id: Optional[str] = None
    protocol: str = Field(default="UDP", max_length=16)
    source_id: str
    source_type: str = Field(default="sensor", max_length=32)
    query_size: Optional[int] = None
    response_size: Optional[int] = None
    duration_ms: Optional[float] = None
    fingerprint: str
    is_demo: bool = False


class DnsEventCreate(BaseModel):
    observed_at: Optional[datetime] = None
    client_ip: str
    client_name: Optional[str] = None
    domain: str
    record_type: str = "A"
    response_code: str = "NOERROR"
    response_details: Optional[str] = None
    resolver_id: Optional[str] = None
    protocol: str = "UDP"
    source_type: str = "import"
    query_size: Optional[int] = None
    response_size: Optional[int] = None
    duration_ms: Optional[float] = None
    is_demo: bool = False


class DnsEventRead(DnsEventBase):
    id: str
    ingested_at: datetime
    model_config = ConfigDict(from_attributes=True)
