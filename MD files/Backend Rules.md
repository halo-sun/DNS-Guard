# Backend Rules

- Use Python 3.12-compatible FastAPI, Pydantic, SQLAlchemy, Alembic, and SQLite initially; keep PostgreSQL portability in mind.
- Organize code into `api/`, `auth/`, `db/`, `schemas/`, `services/`, `collectors/`, `normalization/`, `detection/`, `analytics/`, and `streaming/`.
- Routes validate, authorize, and delegate; they must not contain detection algorithms or complex queries.
- Use versioned routes under `/api/v1`, bounded pagination, validated filters, consistent error envelopes, and UTC timestamps.
- Normalize domains deterministically: lowercase, remove a terminal dot where policy allows, preserve the original query, and reject malformed input safely.
- Use idempotency keys, source offsets, or stable event fingerprints for ingestion deduplication; identical queries at different times are not automatically duplicates.
- Persist evidence and rule configuration with alerts so explanations remain reproducible after thresholds change.
- Keep ingestion adapters independent of the detector and database. A failed record must not silently discard the rest of a valid batch.
- SSE is for one-way live updates; disconnects must be harmless and clients must show connection state.
- Use migrations for schema changes and avoid unrestricted database query parameters.