# DNS Guard API Specification

Base path: `/api/v1`. JSON responses use UTC ISO-8601 timestamps. List endpoints return bounded pagination metadata. Errors use `{ "error": { "code": "...", "message": "...", "details": {} } }`.

## Endpoint groups
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /health`
- `GET /dashboard/summary`
- `GET /events`, `GET /events/{event_id}`, `POST /events/ingest`
- `POST /imports`, `GET /imports/{import_id}`
- `GET /alerts`, `GET /alerts/{alert_id}`, `PATCH /alerts/{alert_id}`
- `POST /alerts/{alert_id}/notes`
- `GET /domains/{normalized_domain}`, `GET /clients`, `GET /clients/{client_id}`
- `GET /analytics`, `GET /exports/events.csv`, `GET /exports/alerts.csv`
- `GET /rules`, `PATCH /rules/{rule_id}`
- `GET /sources`, `POST /sources`, `PATCH /sources/{source_id}`, `GET /sources/{source_id}/status`
- `GET /stream/events` for SSE event and alert notifications

## Filters
Events and alerts accept validated date ranges, search, client, domain, record type, response code, severity, status, category, page, and page size. Reject unreasonable ranges and page sizes.

## Ingestion
Ingestion requires appropriate credentials and accepts normalized JSON batches or validated CSV/JSON files. Responses include accepted, rejected, duplicate counts and structured errors. Ingestion is idempotent according to source identity/offset or stable event fingerprint.

## Authorization
Read-only monitoring can be granted separately from administrative actions. Rule changes, allowlists, source configuration, imports, exports, and alert mutations require an authorized role and create audit records.