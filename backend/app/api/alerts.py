import json
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import AlertModel, AuditLogModel
from ..schemas.alert import AlertRead, AlertUpdate, RuleEvidenceSchema
from ..schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _model_to_schema(alert: AlertModel) -> AlertRead:
    evidence_list = []
    try:
        raw_ev = json.loads(alert.evidence_json)
        evidence_list = [RuleEvidenceSchema(**item) for item in raw_ev]
    except Exception:
        pass

    return AlertRead(
        id=alert.id,
        grouping_key=alert.grouping_key,
        title=alert.title,
        category=alert.category,
        severity=alert.severity,
        risk_score=alert.risk_score,
        status=alert.status,
        client_ip=alert.client_ip,
        normalized_domain=alert.normalized_domain,
        first_seen_at=alert.first_seen_at,
        last_seen_at=alert.last_seen_at,
        related_event_count=alert.related_event_count,
        evidence=evidence_list,
        matched_rules=json.loads(alert.matched_rules_json or "[]"),
        recommended_actions=json.loads(alert.recommended_actions_json or "[]"),
        notes=alert.notes,
        is_demo=alert.is_demo,
    )


@router.get("", response_model=PaginatedResponse[AlertRead])
def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AlertModel)

    if status and status != "all":
        query = query.filter(AlertModel.status == status)
    if severity and severity != "all":
        query = query.filter(AlertModel.severity == severity)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (AlertModel.normalized_domain.ilike(search_term))
            | (AlertModel.client_ip.ilike(search_term))
            | (AlertModel.title.ilike(search_term))
        )

    total_count = query.count()
    total_pages = max(1, math.ceil(total_count / page_size))

    models = (
        query.order_by(AlertModel.last_seen_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [_model_to_schema(m) for m in models]

    return PaginatedResponse(
        items=items,
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
        ),
    )


@router.get("/{alert_id}", response_model=AlertRead)
def get_alert_by_id(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(AlertModel).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Alert {alert_id} not found"}},
        )
    return _model_to_schema(alert)


@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(
    alert_id: str,
    update_data: AlertUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(AlertModel).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Alert {alert_id} not found"}},
        )

    changes = []
    if update_data.status and update_data.status != alert.status:
        old_status = alert.status
        alert.status = update_data.status
        changes.append(f"Status changed from {old_status} to {update_data.status}")

    if update_data.notes is not None:
        alert.notes = update_data.notes
        changes.append("Updated analyst notes")

    # Record append-only audit trail
    if changes:
        audit_log = AuditLogModel(
            user_id="analyst@local",
            action="ALERT_STATUS_UPDATE",
            resource_type="alert",
            resource_id=alert_id,
            metadata_json=json.dumps({"changes": changes, "notes": update_data.notes}),
        )
        db.add(audit_log)

    db.commit()
    db.refresh(alert)
    return _model_to_schema(alert)
