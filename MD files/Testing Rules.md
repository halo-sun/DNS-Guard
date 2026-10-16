# Testing Rules

- Every detector has positive and negative cases, including threshold-boundary cases.
- Unit-test normalization, malformed input rejection, stable fingerprints, scoring bands, severity mapping, allowlist precedence, and alert grouping.
- Test CSV/JSON import validation, partial failures, duplicate ingestion, CoreDNS parsing, pagination, filtering, exports, SSE delivery, and auth/authorization.
- Frontend tests cover navigation, filters, search, form validation, loading/empty/error/offline states, responsive card rendering, and alert status changes.
- Prefer deterministic fixtures and fixed clocks. Synthetic data must be clearly labelled and contain no real browsing history.
- Use integration tests for API-to-database behavior and end-to-end tests for sign-in, demo start, detection, investigation, status change, filtering, and export.
- Do not mutate shared production-like data in tests without isolation or cleanup.
- Run formatters, linters, type checks, unit tests, integration tests, and a production build before release. Never report a check that was not executed.