from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db.models import AuditLogModel

MAX_PAGE_SIZE = 500


def list_audit_logs(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))
    page = max(1, page)

    query = db.query(AuditLogModel)

    if action:
        query = query.filter(AuditLogModel.action == action)
    if resource_type:
        query = query.filter(AuditLogModel.resource_type == resource_type)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (AuditLogModel.resource_id.ilike(search_term))
            | (AuditLogModel.metadata_json.ilike(search_term))
        )

    total_count = query.count()

    rows = (
        query.order_by(AuditLogModel.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for row in rows:
        metadata = {}
        try:
            import json

            metadata = json.loads(row.metadata_json or "{}")
        except Exception:
            metadata = {}

        items.append(
            {
                "id": row.id,
                "user_id": row.user_id,
                "action": row.action,
                "resource_type": row.resource_type,
                "resource_id": row.resource_id,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "metadata": metadata,
            }
        )

    import math

    return {
        "items": items,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": max(1, math.ceil(total_count / page_size)),
        },
    }
