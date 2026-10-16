from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class RuleEvidenceSchema(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    threshold_used: Any
    observed_value: Any
    contribution: int
    explanation: str
    details: Optional[Dict[str, Any]] = None


class AlertBase(BaseModel):
    grouping_key: str
    title: str
    category: str
    severity: str = Field(..., pattern="^(low|medium|high|critical|informational)$")
    risk_score: int = Field(..., ge=0, le=100)
    status: str = Field(default="new", pattern="^(new|investigating|benign|confirmed|closed)$")
    client_ip: str
    normalized_domain: str
    first_seen_at: datetime
    last_seen_at: datetime
    related_event_count: int = 1
    evidence: List[RuleEvidenceSchema] = []
    matched_rules: List[str] = []
    recommended_actions: List[str] = []
    notes: Optional[str] = None
    is_demo: bool = False


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|investigating|benign|confirmed|closed)$")
    notes: Optional[str] = None


class AlertRead(AlertBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
