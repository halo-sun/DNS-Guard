from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=200)
    total_count: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    meta: PaginationMeta
