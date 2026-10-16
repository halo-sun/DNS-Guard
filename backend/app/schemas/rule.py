from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class DetectionRuleBase(BaseModel):
    rule_id: str
    name: str
    category: str
    description: str
    enabled: bool = True
    contribution: int = Field(..., ge=1, le=100)
    threshold: Dict[str, Any]


class DetectionRuleUpdate(BaseModel):
    enabled: Optional[bool] = None
    contribution: Optional[int] = Field(None, ge=1, le=100)
    threshold: Optional[Dict[str, Any]] = None


class DetectionRuleRead(DetectionRuleBase):
    id: str
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
