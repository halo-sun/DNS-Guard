import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Tuple

from sqlalchemy.orm import Session

from ..db.models import (
    AlertModel,
    AllowlistEntryModel,
    DetectionRuleModel,
    DnsEventModel,
)
from ..detection.engine import (
    DetectionContext,
    DetectionEngine,
    calculate_risk_score,
    score_to_severity,
)

engine = DetectionEngine()


def ingest_event_batch(
    db: Session,
    events_data: List[Dict[str, Any]],
) -> Tuple[int, int, int]:
    """
    Ingests a batch of normalized event dictionaries.
    Returns: (accepted_count, rejected_count, duplicate_count)
    """
    accepted = 0
    rejected = 0
    duplicates = 0

    # Fetch active detection rules and allowlist
    rules = db.query(DetectionRuleModel).all()
    rule_configs = {
        r.rule_id: {
            "enabled": r.enabled,
            "contribution": r.contribution,
            "threshold": json.loads(r.threshold_json),
        }
        for r in rules
    }

    allowlist_entries = db.query(AllowlistEntryModel).filter_by(enabled=True).all()
    active_allowlist = {entry.pattern.lower() for entry in allowlist_entries}

    for data in events_data:
        # Check deduplication by fingerprint
        fp = data.get("fingerprint")
        if fp:
            existing = db.query(DnsEventModel).filter_by(fingerprint=fp).first()
            if existing:
                duplicates += 1
                continue

        try:
            event_obj = DnsEventModel(**data)
            db.add(event_obj)
            db.flush()  # assign ID and persist in session
            accepted += 1

            # Fetch recent context for the client endpoint
            time_window = datetime.now(timezone.utc) - timedelta(minutes=5)
            recent_client_events = (
                db.query(DnsEventModel)
                .filter(
                    DnsEventModel.client_ip == event_obj.client_ip,
                    DnsEventModel.observed_at >= time_window,
                )
                .all()
            )

            context = DetectionContext(
                recent_events_client=recent_client_events,
                recent_events_domain=[],
                active_allowlist=active_allowlist,
                rule_configs=rule_configs,
            )

            findings = engine.evaluate(event_obj, context)
            if findings:
                risk_score = calculate_risk_score(findings)
                severity = score_to_severity(risk_score)
                evidence_json = json.dumps([f.to_schema().model_dump() for f in findings])
                matched_rules_json = json.dumps([f.rule_id for f in findings])

                grouping_key = f"{event_obj.client_ip}:{event_obj.normalized_domain}"

                # Group burst alerts by grouping_key and open status
                existing_alert = (
                    db.query(AlertModel)
                    .filter(
                        AlertModel.grouping_key == grouping_key,
                        AlertModel.status.in_(["new", "investigating"]),
                    )
                    .first()
                )

                if existing_alert:
                    existing_alert.related_event_count += 1
                    existing_alert.last_seen_at = event_obj.observed_at
                    # Update score if higher finding
                    if risk_score > existing_alert.risk_score:
                        existing_alert.risk_score = risk_score
                        existing_alert.severity = severity
                        existing_alert.evidence_json = evidence_json
                        existing_alert.matched_rules_json = matched_rules_json
                else:
                    new_alert = AlertModel(
                        grouping_key=grouping_key,
                        title=f"Suspicious DNS Activity: {event_obj.normalized_domain}",
                        category=findings[0].category,
                        severity=severity,
                        risk_score=risk_score,
                        status="new",
                        client_ip=event_obj.client_ip,
                        normalized_domain=event_obj.normalized_domain,
                        first_seen_at=event_obj.observed_at,
                        last_seen_at=event_obj.observed_at,
                        related_event_count=1,
                        evidence_json=evidence_json,
                        matched_rules_json=matched_rules_json,
                        recommended_actions_json=json.dumps(
                            [
                                f"Review client {event_obj.client_ip} network egress.",
                                f"Investigate subdomain structure for {event_obj.normalized_domain}.",
                            ]
                        ),
                        is_demo=event_obj.is_demo,
                    )
                    db.add(new_alert)

        except Exception:
            rejected += 1

    db.commit()
    return accepted, rejected, duplicates
