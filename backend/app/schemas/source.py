from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class DataSourceBase(BaseModel):
    name: str
    type: str = Field(..., pattern="^(demo|file_import|coredns|sensor)$")
    enabled: bool = True
    config_metadata: Optional[Dict[str, Any]] = None


class DataSourceUpdate(BaseModel):
    enabled: Optional[bool] = None
    config_metadata: Optional[Dict[str, Any]] = None


class DataSourceRead(DataSourceBase):
    id: str
    health_status: str
    last_event_at: Optional[datetime] = None
    last_error: Optional[str] = None
    event_count: int = 0
    model_config = ConfigDict(from_attributes=True)
