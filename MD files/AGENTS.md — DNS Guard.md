# AGENTS.md — DNS Guard

## Mission
Build and maintain a credible educational DNS monitoring and threat-detection system. Accuracy, explainability, privacy, and honest source visibility take priority over decorative complexity.

## Required reading
Before changing behavior, read `PROJECT_SPEC.md` and the subsystem document involved: `ARCHITECTURE.md`, `API_SPEC.md`, `DATABASE_SCHEMA.md`, `DETECTION_RULES.md`, `DATA_SOURCES.md`, `UI_UX_SPEC.md`, `SECURITY_PRIVACY.md`, or `TESTING_PLAN.md`.

## Non-negotiable behavior
- The browser does not capture all device DNS traffic.
- Demo data is visibly marked and is never presented as live observation.
- Risk scores are normalized application scores, not probabilities.
- Heuristics are findings, not proof of compromise.
- Observe-only is the default; no automatic blocking or resolver changes.
- Missing source fields remain missing.
- Administrative actions are authenticated, authorized, validated, and audited.

## Working method
Prefer incremental vertical slices and small modules. Preserve concurrent work. Update docs and tests with behavior changes. Use UTC in APIs and storage. Run relevant checks before claiming completion. Keep secrets and real sensitive DNS logs out of the repository.

## Source of truth
The project specification and the documents in this repository define intended behavior. If implementation differs, document the gap and update the roadmap; do not silently weaken the requirement.