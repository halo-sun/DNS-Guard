# DNS Guard Testing Plan

## Unit coverage
Test domain normalization, CoreDNS parsing, CSV/JSON validation, malformed records, stable deduplication, rule matching, thresholds, score caps, severity boundaries, allowlist precedence, alert grouping, and evidence generation. Each detector needs positive, negative, and boundary fixtures.

## API and persistence coverage
Test authentication and authorization, health, pagination, filters, date-range limits, ingestion counts, duplicate handling, import history, alert status and notes, audit records, domain/client summaries, CSV exports, and SSE delivery. Use isolated databases and deterministic clocks.

## Frontend coverage
Test routing, responsive navigation, query loading/error/empty/offline states, search and filters, validation, mobile event cards, source-status indicators, alert-detail rendering, status updates, and demo-mode labelling.

## End-to-end journeys
Sign in, start demo mode, observe generated events, trigger a known test finding, inspect evidence, change status, filter events/alerts, and export a report. Repeat at desktop and mobile widths. Verify that live mode does not use hardcoded demo metrics.

## Release evidence
Run formatter, linter, type checker, backend tests, frontend tests, integration tests, end-to-end tests, and production build. Record commands, environment, pass/fail counts, and known limitations; never claim unexecuted coverage.