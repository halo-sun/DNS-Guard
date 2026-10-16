import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import AuditLogModel, DetectionRuleModel
from ..schemas.rule import DetectionRuleRead, DetectionRuleUpdate

router = APIRouter(prefix="/rules", tags=["Detection Rules"])


def _rule_to_schema(r: DetectionRuleModel) -> DetectionRuleRead:
    return DetectionRuleRead(
        id=r.id,
        rule_id=r.rule_id,
        name=r.name,
        category=r.category,
        description=r.description,
        enabled=r.enabled,
        contribution=r.contribution,
        threshold=json.loads(r.threshold_json or "{}"),
        updated_at=r.updated_at,
    )


@router.get("", response_model=List[DetectionRuleRead])
def get_rules(db: Session = Depends(get_db)):
    rules = db.query(DetectionRuleModel).all()
    return [_rule_to_schema(r) for r in rules]


@router.patch("/{rule_id}", response_model=DetectionRuleRead)
def update_rule(
    rule_id: str,
    update_data: DetectionRuleUpdate,
    db: Session = Depends(get_db),
):
    rule = db.query(DetectionRuleModel).filter_by(rule_id=rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Rule {rule_id} not found"}},
        )

    if update_data.enabled is not None:
        rule.enabled = update_data.enabled
    if update_data.contribution is not None:
        rule.contribution = update_data.contribution
    if update_data.threshold is not None:
        rule.threshold_json = json.dumps(update_data.threshold)

    # Audit log
    audit_log = AuditLogModel(
        user_id="admin@local",
        action="RULE_UPDATE",
        resource_type="rule",
        resource_id=rule_id,
        metadata_json=json.dumps(update_data.model_dump(exclude_unset=True)),
    )
    db.add(audit_log)

    db.commit()
    db.refresh(rule)
    return _rule_to_schema(rule)
