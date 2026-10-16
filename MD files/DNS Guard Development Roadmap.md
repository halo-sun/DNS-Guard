# DNS Guard Development Roadmap

## Phase 1 — Foundation
Establish React/PWA and FastAPI package structure, environment templates, database connection, migrations, shared types, health endpoint, and documented local startup.

## Phase 2 — UI vertical slice
Build the navigation shell, dashboard, Live DNS table/cards, alert list/detail, reusable states, responsive layout, and visibly labelled deterministic demo mode.

## Phase 3 — Persistence and access
Add models, migrations, authentication, authorization, audit logging, dashboard summaries, event/alert APIs, pagination, filters, and frontend API integration.

## Phase 4 — Detection
Implement normalization, fingerprints, modular rules, scoring bands, evidence, alert deduplication, allowlists, status transitions, and positive/negative tests.

## Phase 5 — Real sources
Implement validated CSV/JSON import and configurable CoreDNS parsing, source health, processing errors, import history, and SSE delivery. Preserve explicit coverage limitations.

## Phase 6 — Cross-platform finish
Add PWA manifest/service worker, offline messaging, export, analytics, mobile accessibility, retention controls, deployment hardening, and documentation.

## Completion gate
Do not mark a feature complete from visual rendering alone. Require working backend behavior, persistence, validation, error paths, tests, and evidence that demo and observed data remain distinct.