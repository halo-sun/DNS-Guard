import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import AuditLogModel, DataSourceModel
from ..schemas.source import DataSourceRead, DataSourceUpdate

router = APIRouter(prefix="/sources", tags=["Data Sources"])


def _source_to_schema(s: DataSourceModel) -> DataSourceRead:
    return DataSourceRead(
        id=s.id,
        name=s.name,
        type=s.type,
        enabled=s.enabled,
        health_status=s.health_status,
        last_event_at=s.last_event_at,
        last_error=s.last_error,
        event_count=s.event_count,
        config_metadata=json.loads(s.config_metadata_json or "{}"),
    )


@router.get("", response_model=List[DataSourceRead])
def get_sources(db: Session = Depends(get_db)):
    sources = db.query(DataSourceModel).all()
    return [_source_to_schema(s) for s in sources]


@router.patch("/{source_id}", response_model=DataSourceRead)
def update_source(
    source_id: str,
    update_data: DataSourceUpdate,
    db: Session = Depends(get_db),
):
    src = db.query(DataSourceModel).filter_by(id=source_id).first()
    if not src:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Source {source_id} not found"}},
        )

    if update_data.enabled is not None:
        src.enabled = update_data.enabled
    if update_data.config_metadata is not None:
        src.config_metadata_json = json.dumps(update_data.config_metadata)

    # Audit log
    audit_log = AuditLogModel(
        user_id="admin@local",
        action="SOURCE_UPDATE",
        resource_type="data_source",
        resource_id=source_id,
        metadata_json=json.dumps(update_data.model_dump(exclude_unset=True)),
    )
    db.add(audit_log)

    db.commit()
    db.refresh(src)
    return _source_to_schema(src)
