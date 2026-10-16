# DNS Guard — Autonomous Implementation Prompts

## Instructions for Antigravity

Read this entire file before making changes. Then read the existing project documents listed below and inspect the complete repository, including hidden configuration and Git history where useful. Preserve valid existing work; do not replace or delete specifications merely to simplify implementation.

Execute the numbered prompts in order. Treat each prompt’s acceptance criteria as a completion gate. Make reasonable routine decisions without waiting for approval, but stop for genuine blockers such as unavailable credentials, destructive operations, an unresolved material contradiction, or a requirement that cannot safely be inferred. Do not stop for routine progress confirmation.

After every meaningful stage, run the relevant checks, inspect failures, repair regressions, and record a concise progress note in `IMPLEMENTATION_PROGRESS.md` containing completed stages, pending stages, commands run, outcomes, and real blockers. Continue automatically after a stage passes. Revisit earlier code when integration reveals a defect.

Never claim that a command, test, migration, live source, authentication flow, or deployment succeeded unless you actually ran and verified it. Finish with a runnable application, exact startup instructions, known limitations, and a factual completion report.

### Existing project documents to read

The inspected repository currently contains:

- `AGENTS.md` and `.agents/rules/*.md`: contributor, frontend, backend, security, testing, and project conventions.
- `PROJECT_SPEC.md`: product scope and non-negotiable behavior.
- `ARCHITECTURE.md`: logical layers and module boundaries.
- `API_SPEC.md`: versioned endpoint groups and API conventions.
- `DATABASE_SCHEMA.md`: initial entities and persistence expectations.
- `DETECTION_RULES.md`: rule categories, contributions, scoring, and alert semantics.
- `DATA_SOURCES.md`: demo, import, CoreDNS, normalization, and coverage rules.
- `UI_UX_SPEC.md`: current product UI direction and responsive behavior.
- `SECURITY_PRIVACY.md`: privacy, authentication, observe-only, and audit requirements.
- `THREAT_MODEL.md`: assets, actors, boundaries, and residual risks.
- `TESTING_PLAN.md`: unit, API, frontend, integration, and end-to-end expectations.
- `DEVELOPMENT_ROADMAP.md`: intended phased delivery.
- `DEPLOYMENT_GUIDE.md`: environment, local, LAN, production, and operations guidance.
- `README.md`: current project overview and limitations.

No `DESIGN-linear.app(1).md` or equivalent design file was present during the audit. Therefore use the design tokens in this document as the provisional visual reference, and record this decision in `IMPLEMENTATION_PROGRESS.md`. If a design file is later added, inspect it and reconcile its values with this prompt and `UI_UX_SPEC.md`; do not silently replace the project’s functional requirements.

### Global engineering rules

1. Preserve the architecture: authorized DNS sources → collection/normalization → persistent storage → detection/risk analysis → alerts → REST/SSE → React UI.
2. The frontend never connects directly to the database and never claims to capture all Windows, Android, or network DNS traffic.
3. Demo, imported, and resolver-sourced events must remain distinguishable in storage and UI.
4. Risk scores are bounded application scores, not probabilities. Heuristic findings are not confirmed malware.
5. DNS Guard is observe-only by default. Do not add automatic blocking, resolver changes, packet capture, ML, commercial threat-intelligence calls, SIEM integrations, or unrelated enterprise features.
6. Every visible control must have a real behavior or be clearly marked unavailable. No dead buttons or fake success messages.
7. Use small cohesive modules, typed contracts, UTC timestamps, bounded queries, safe parsing, and migrations.
8. Never commit secrets, real browsing metadata, private credentials, or untrusted uploaded files.
9. Maintain consistent event fields, alert fields, severity values, score semantics, pagination, timestamps, errors, and SSE payloads across backend and frontend.
10. Update dependent tests and documentation when a contract changes.

### Provisional visual system

Use a Linear-inspired, near-black, product-focused interface without copying Linear branding, logo, or exact screens. Establish reusable CSS variables/design tokens:

| Token | Value |
|---|---|
| Canvas | `#010102` |
| Primary lavender-blue | `#5e6ad2` |
| Primary hover | `#828fff` |
| Primary focus | `#5e69d1` |
| Primary text | `#f7f8f8` |
| Muted text | `#d0d6e0` |
| Subtle text | `#8a8f98` |
| Tertiary text | `#62666d` |
| Surface 1 | `#0f1011` |
| Surface 2 | `#141516` |
| Surface 3 | `#18191a` |
| Surface 4 | `#191a1b` |
| Hairline border | `#23252a` |
| Strong border | `#34343a` |
| Success | `#27a644` |

Use Inter or Geist as a freely available substitute. Use lavender-blue sparingly for primary actions, selected navigation, focus, and intentional emphasis. Avoid decorative gradients, glowing cards, excessive shadows, glassmorphism, random accent colors, and unnecessary motion. Severity colors may use restrained red/amber/green semantics because security status must remain legible; pair them with text/icons and do not rely on color alone.

---

## Prompt 1 — Repository audit and implementation plan

**Objective**

Establish an accurate implementation baseline from the real repository before editing.

**Instructions for Antigravity**

Read this file completely, then read every existing Markdown file named above and inspect all source, configuration, dependency manifests, diagrams, migrations, fixtures, tests, and ignored files that affect development. Identify the actual current stack, commands, naming conventions, route structure, and existing implementation. Check for contradictions among `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `UI_UX_SPEC.md`, `DETECTION_RULES.md`, and `DEPLOYMENT_GUIDE.md`. Preserve valid work and document only justified adjustments. Because the selected design file is absent, record the provisional token decision above.

Create or update `IMPLEMENTATION_PLAN.md` with a concise dependency-aware plan, actual file layout, decisions, assumptions, unresolved issues, and the order in which the remaining prompts will be executed. Do not wait for approval after writing the plan.

**Expected deliverables**

`IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_PROGRESS.md`, and a repository audit summary based on actual files.

**Acceptance criteria**

The plan names the real project structure, does not claim nonexistent code or design files, resolves or records document conflicts, and preserves the three-module architecture.

**Validation commands**

```bash
find . -maxdepth 4 -type f | sort
find . -type f -name '*.md' -print
```

Also run the repository’s existing check command if one exists.

**Completion report**

Record files inspected, decisions made, commands run, results, and genuine blockers.

---

## Prompt 2 — Repository structure and development environment

**Objective**

Create or complete a maintainable runnable project structure without unnecessary infrastructure.

**Instructions for Antigravity**

Use an explicit layout compatible with existing files. Unless inspection proves otherwise, use:

```text
frontend/                  React/Vite/TypeScript app
backend/app/               FastAPI package
backend/tests/             backend tests
frontend/src/              pages, components, hooks, API client, types
migrations/                Alembic migrations
sample-data/               safe synthetic fixtures and sample logs
docs/                      supporting notes only
scripts/                   local setup, checks, or fixture helpers
```

Create `pyproject.toml` with supported Python constraints, FastAPI, Pydantic, SQLAlchemy, Alembic, pytest, and Ruff. Create frontend `package.json`, lockfile, strict TypeScript configuration, Vite configuration, and scripts for `dev`, `build`, `preview`, `test`, `typecheck`, and `lint`. Use mutually compatible package versions; do not assume dependencies are installed.

Create `.env.example`, `.gitignore`, root scripts or a documented command wrapper, and local configuration for SQLite. Keep production configuration separate. Default local binding to loopback unless the existing managed runtime requires otherwise.

**Expected deliverables**

Dependency manifests and lockfiles, Python package skeleton, frontend skeleton, environment template, ignore rules, root commands, and updated setup documentation.

**Acceptance criteria**

A fresh checkout can create the Python environment, install backend dependencies, install frontend dependencies, and start both applications using documented commands. No secret values are committed.

**Validation commands**

```bash
python --version
python -m venv .venv
.venv/bin/pip install -e '.[dev]'
cd frontend && npm ci
npm run typecheck
npm run build
```

Use the actual package manager and commands selected by the repository, and report any unavailable tool honestly.

**Completion report**

Report the chosen toolchain, files created, installation/build results, and unresolved environment issues.

---

## Prompt 3 — Design tokens and frontend foundation

**Objective**

Establish the approved near-black visual identity and accessible reusable primitives before building product screens.

**Instructions for Antigravity**

Implement CSS variables for every provisional token in this file, global typography, spacing, radii, borders, focus rings, reduced-motion behavior, and responsive breakpoints. Configure Tailwind around those variables rather than scattering raw colors. Use Inter or Geist with a safe system fallback.

Create reusable primitives for Button, Input, Select, Badge, Card, Panel, Dialog, Tooltip, Table, EmptyState, LoadingState, ErrorState, OfflineState, StatusDot, SeverityBadge, PageHeader, and ConfirmAction. They must be semantic, keyboard accessible, focus-visible, and usable on touch screens. Use icons from Lucide and avoid decorative icon-only controls without accessible labels.

Create the first application shell with a simple original DNS Guard mark—not a copied Linear logo—plus a responsive sidebar/top bar, content container, skip link, error boundary, and theme metadata. Keep tables and chart panels visually consistent.

**Expected deliverables**

Design-token files, Tailwind/Vite configuration, reusable primitives, global styles, original mark/icon, shell scaffolding, and component tests.

**Acceptance criteria**

The app renders a polished near-black shell with readable contrast, visible focus, consistent surfaces/borders, responsive spacing, and no prohibited gradients/glows/glass effects. Primitive controls expose real state and accessibility behavior.

**Validation commands**

```bash
cd frontend
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

**Completion report**

List token files, primitives, accessibility checks, and passed commands.

---

## Prompt 4 — Frontend application shell and navigation

**Objective**

Build a complete navigable structure where every primary destination is real and clearly states its status.

**Instructions for Antigravity**

Implement React Router routes for `/`, `/live-dns`, `/alerts`, `/domains`, `/clients`, `/analytics`, `/rules`, `/sources`, and `/settings`, plus event, alert, domain, and client detail patterns where needed. Use a route manifest at `public/manus-routes.json` containing every page route and no API/assets. Add a not-found route.

Build desktop collapsible sidebar navigation and mobile drawer or compact bottom navigation. Add active states, page titles, contextual actions, breadcrumbs where useful, and a compact source/demo status strip. Navigation must work by keyboard and touch. Do not add links to unimplemented screens without an honest placeholder explaining what is unavailable.

**Expected deliverables**

Route modules, shell layout, navigation components, route manifest, not-found page, and navigation tests.

**Acceptance criteria**

Every required navigation item reaches a real route, active state is correct, mobile navigation works without horizontal overflow, unknown routes are handled, and route declarations match source.

**Validation commands**

```bash
cd frontend
npm test -- --run
npm run typecheck
npm run build
curl -f http://localhost:5173/manus-routes.json
```

Use the actual dev port and verify the JSON is not SPA fallback HTML.

**Completion report**

Report route list, desktop/mobile behavior, tests, and any route intentionally marked incomplete.

---

## Prompt 5 — DNS Guard dashboard and demonstration experience

**Objective**

Create a realistic overview dashboard that is useful before backend integration but never disguises synthetic data as live telemetry.

**Instructions for Antigravity**

Build the dashboard with metrics for total queries, suspicious events, open alerts, unique clients, unique domains, source health, and last update. Add query activity over time, severity distribution, top domains, active clients, recent alerts, NXDOMAIN summary, and anomaly summary. Use Recharts only where it improves comprehension and make chart labels/tooltips/legends responsive.

Create deterministic demo fixtures representing normal browsing, repeated queries, NXDOMAIN failures, long labels, high volume, and suspicious-looking domains. Mark every demo-derived metric, event, and alert with a visible `DEMO MODE` indicator and source label. Include useful empty/loading/error/offline states. Avoid hard-coded values that look live.

Create dashboard card links to filtered event/alert/domain/client views.

**Expected deliverables**

Dashboard page, demo fixtures/generator, summary components, charts, recent-event/alert components, and tests for demo labelling and states.

**Acceptance criteria**

The dashboard is coherent at desktop and mobile widths, all displayed demo metrics are visibly synthetic, cards navigate to meaningful filtered views, and no control claims live monitoring before backend integration.

**Validation commands**

```bash
cd frontend
npm test -- --run
npm run typecheck
npm run build
```

**Completion report**

Report dashboard components, fixture scenarios, responsive checks, and known temporary integration points.

---

## Prompt 6 — Backend foundation and configuration

**Objective**

Build a clean FastAPI foundation with typed schemas, versioned routes, configuration, health, logging, and safe errors.

**Instructions for Antigravity**

Create `backend/app/main.py`, settings, dependency injection, API router modules, structured logging, and `/api/v1/health`. Use Pydantic settings or an equivalent typed configuration layer. Configure allowed origins from environment, safe error envelopes, request IDs where practical, and development/production differences. Do not log full domain activity or secrets unnecessarily.

Create API modules for auth, dashboard, events, imports, alerts, domains, clients, analytics, rules, sources, exports, and streaming, even if some initially return a documented not-configured response. Do not expose arbitrary SQL or unrestricted filters. Keep routes thin and delegate to services.

**Expected deliverables**

FastAPI app package, configuration, API version router, error handlers, health route, logging setup, CORS configuration, and backend smoke tests.

**Acceptance criteria**

The backend starts, health returns an unauthenticated 2xx response, invalid requests produce consistent errors, CORS is restricted by configuration, and route modules do not contain detection/database business logic.

**Validation commands**

```bash
.venv/bin/ruff check backend
.venv/bin/pytest backend/tests -q
.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
curl -f http://127.0.0.1:8000/api/v1/health
```

**Completion report**

Report startup, health response, configuration variables, and test results.

---

## Prompt 7 — Database models and migrations

**Objective**

Implement durable persistence for source facts, detection findings, alerts, configuration, imports, users, and audit history.

**Instructions for Antigravity**

Use SQLAlchemy models and Alembic migrations. Implement entities and relationships from `DATABASE_SCHEMA.md`: users, DNS events, alerts, detection rules, data sources, allowlist entries, audit logs, and imports. Keep nullable source fields nullable. Store original and normalized domain values, provenance, fingerprints, evidence snapshots, rule snapshots, timestamps, and counts required for investigation.

Create database settings, engine/session dependencies, repositories or query services, indexes for observed time, normalized domain, client, alert status, and source. Use UTC consistently. Prefer disablement over destructive deletion for rules, sources, users, and allowlists. Add a migration and initialization path that is safe across restarts.

**Expected deliverables**

Models, relationships, indexes, Alembic environment and initial migration, session dependency, repository/query layer, fixtures, and database tests.

**Acceptance criteria**

A fresh SQLite database can migrate successfully, data survives an ordinary restart, foreign-key relationships work, nullable fields remain accurate, and no test relies on an uncontrolled schema mutation.

**Validation commands**

```bash
.venv/bin/alembic upgrade head
.venv/bin/pytest backend/tests -q
.venv/bin/ruff check backend
```

**Completion report**

Report migration revision, entities/indexes, persistence tests, and any PostgreSQL portability notes.

---

## Prompt 8 — DNS event collection and normalization

**Objective**

Implement Module 1 as a real, testable ingestion pipeline.

**Instructions for Antigravity**

Define a canonical typed DNS event schema shared by collector, database, detector, API, and frontend. Include event ID, observed timestamp, client IP/name, original and normalized domain, record type, response code/details, resolver/sensor ID, protocol, ingestion source, optional query/response sizes and duration, ingestion timestamp, provenance, and fingerprint.

Implement domain normalization with lowercase handling, terminal DNS-dot policy, IDNA or clearly documented accepted domain behavior, label/domain length limits, and preservation of the original value. Validate IPs, timestamps, record types, response codes, and required fields. Missing data remains missing. Reject malformed records safely with structured errors.

Implement deterministic demo generation, CSV import, JSON import, batch processing, valid/invalid/duplicate counts, import history, and idempotency using source identity/offset or a stable fingerprint. Do not treat identical queries at different timestamps as duplicates. Create safe fixtures under `sample-data/`.

Implement CoreDNS ingestion only for a concrete documented log format. If the repository cannot support a reliable format, expose a configured/unsupported state rather than pretending it is live.

**Expected deliverables**

Canonical schemas, normalizer, import services, demo generator, CoreDNS parser or honest unsupported adapter, persistence integration, fixtures, and unit/integration tests.

**Acceptance criteria**

Valid CSV/JSON records persist, malformed rows are reported without losing valid rows, repeats are deduplicated according to policy, domains/timestamps normalize consistently, demo/import/source labels persist, and CoreDNS claims match the actual parser format.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'event or import or normalize or coredns'
.venv/bin/ruff check backend
```

**Completion report**

Report supported schemas, parser limitations, counts from fixtures, and tests passed.

---

## Prompt 9 — Threat detection and risk scoring

**Objective**

Implement Module 2 as a modular explainable detector independent of HTTP and React.

**Instructions for Antigravity**

Define a detector interface that accepts canonical events plus relevant recent-window context and returns findings containing rule ID, category, enabled state, threshold, observed values, evidence fields, explanation, contribution, and confidence language that does not imply probability.

Implement separate rules for known configured indicators, long labels, encoded-looking labels, high-entropy labels, possible tunneling combinations, NXDOMAIN spikes, client query-rate anomalies, and possible DGA-like behavior where fields support it. A single long label or TXT query cannot alone trigger tunneling. Allowlist precedence must be explicit; do not silently suppress authoritative indicator matches.

Calculate `min(100, sum(contributions))` using configured enabled rules. Use severity bands from `DETECTION_RULES.md`; if adding Informational, document its boundary without conflicting with existing Low/Medium/High/Critical semantics. Group related findings by rule/client/domain/time window and retain first/last seen and event count.

Persist alert evidence and rule snapshots so explanations remain stable after configuration changes. Document false-positive risks and insufficient-data behavior.

**Expected deliverables**

Detector interfaces, individual rule modules, scoring/severity service, grouping/deduplication, allowlist logic, rule configuration models, alert persistence, documentation updates if needed, and positive/negative/boundary tests.

**Acceptance criteria**

Normal traffic does not alert unexpectedly, required suspicious scenarios produce explainable findings, scores cap at 100, severity boundaries are tested, insufficient data is handled conservatively, and no finding is described as confirmed malware.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'detect or rule or score or alert'
.venv/bin/ruff check backend
```

**Completion report**

Report each implemented rule, thresholds, score mapping, grouping behavior, and test evidence.

---

## Prompt 10 — Alerts, event queries, and domain/client exploration

**Objective**

Expose persisted events and alerts through useful bounded APIs and functional investigation pages.

**Instructions for Antigravity**

Implement validated paginated event and alert queries with search, date range, client, normalized domain, record type, response code, severity, status, category, sort, page, and bounded page size. Add event and alert detail endpoints. Implement supported alert status transitions, analyst notes, audit records, related events, first/last seen, counts, evidence, matched rules, and recommended investigation steps.

Implement domain investigation with query history, observed clients, volume over time, type/response distributions, associated alerts, detection reasons, and optional reputation status only when configured. Implement client inventory/details with observed IP, optional label, first/last observed, query count, distinct domain count, open alerts, and recent activity. Do not imply an IP is a person.

Connect the Live DNS, Threat Alerts, Domain Explorer, and Clients pages to real API data through typed hooks. Add mobile event/alert cards and honest loading, empty, error, and disconnected states.

**Expected deliverables**

API query services/routes/schemas, authorization checks, frontend pages and hooks, detail views, status mutation UI, analyst notes, filters, pagination, and tests.

**Acceptance criteria**

Queries are bounded and validated, filters produce correct results, alert status changes persist and audit, evidence is visible, domain/client views use stored data, and frontend controls perform real requests.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'api or alert or event or domain or client'
cd frontend && npm test -- --run && npm run typecheck
```

**Completion report**

Report endpoint behavior, implemented filters, mutation/audit results, and frontend integration status.

---

## Prompt 11 — Analytics and historical reporting

**Objective**

Build analytics from persisted events and alerts rather than permanent placeholders.

**Instructions for Antigravity**

Implement selectable time ranges with explicit timezone and aggregation-window behavior. Provide query-volume trends, top domains, active clients, response-code distributions, severity breakdowns, NXDOMAIN/anomaly trends, and alert trends justified by stored fields. Define missing-data behavior and empty states.

Add bounded analytics endpoints and frontend chart panels with readable axis labels, legends, tooltips, responsive layout, and no misleading zeroes when data is unavailable. Add CSV exports for relevant tables/reports with explicit source/time-range metadata. Ensure export authorization and safe content disposition.

**Expected deliverables**

Analytics service/routes/schemas, aggregation queries, export service/routes, frontend Analytics page, charts, CSV tests, and documentation of aggregation/timezone semantics.

**Acceptance criteria**

Metrics change when stored events change, date ranges are honored, empty periods are honest, charts work on mobile, exports contain correct filtered rows, and no analytics view silently uses hardcoded demo values outside demo mode.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'analytic or export'
cd frontend && npm test -- --run && npm run typecheck && npm run build
```

**Completion report**

Report metrics, aggregation rules, export format, and test results.

---

## Prompt 12 — REST API integration

**Objective**

Replace temporary frontend fixtures with a centralized typed API integration while retaining an explicit demo path.

**Instructions for Antigravity**

Create a centralized API client with base URL configuration, typed request/response schemas, auth/session handling, query-string serialization, consistent error parsing, cancellation, and safe retry behavior. Use TanStack Query for caching, invalidation, mutations, pagination, stale state, and refetching. Use shared schema definitions or generated types where practical, but avoid duplicating incompatible field names.

Connect dashboard summary, events, alerts, domain/client, analytics, rules, sources, imports, settings, and health/status pages to actual endpoints. Keep demo mode explicit and deterministic; it may use a backend demo endpoint or fixture adapter, but must never masquerade as live mode. Add mutation feedback only after the server confirms success.

**Expected deliverables**

Typed API client, query/mutation hooks, schemas/types, API error components, connected pages, demo/live source switch behavior, and integration tests.

**Acceptance criteria**

Frontend field names, pagination, timestamps, severity, and error formats match backend contracts. Loading/error/empty states are intentional. No core live screen relies on hard-coded telemetry.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q
cd frontend && npm test -- --run && npm run typecheck && npm run lint && npm run build
```

**Completion report**

Report each connected route, cache/mutation behavior, and removed temporary data.

---

## Prompt 13 — Real-time updates using SSE

**Objective**

Add safe one-way event and alert streaming with reconnection and honest connection status.

**Instructions for Antigravity**

Implement `/api/v1/stream/events` using SSE with documented event names and payloads for new DNS events, new alerts, source status, and optional heartbeat. Authenticate/authorize as appropriate. Do not expose unrestricted data to unauthenticated clients. Ensure disconnects release resources.

Create a frontend subscription hook that opens one connection per relevant application lifecycle, cleans up on unmount, handles duplicate event IDs, backoff reconnection, connection status, and bounded client-side accumulation. Provide polling/refresh fallback when SSE is unavailable. Do not open a connection on every render.

**Expected deliverables**

SSE service/route, event bus or bounded queue, payload schemas, frontend subscription hook, connection banner/status UI, fallback behavior, and lifecycle tests.

**Acceptance criteria**

A newly ingested event can reach subscribed clients where supported, alert notifications update relevant views, disconnect/reconnect is visible and safe, duplicates do not inflate counts, and the app does not leak connections or grow memory without bound.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'stream or sse'
cd frontend && npm test -- --run && npm run typecheck
```

**Completion report**

Report event names, auth behavior, reconnection strategy, fallback, and test results.

---

## Prompt 14 — Import interface and ingestion management

**Objective**

Deliver a complete safe import workflow with preview, validation, progress/status, and provenance.

**Instructions for Antigravity**

Build a Data Sources/import UI with file selection, accepted CSV/JSON formats, size/type validation, preview of safe fields, valid/invalid/duplicate counts, structured rejected-record explanations, import status, and source labeling. Do not execute uploaded files or treat contents as instructions. Avoid rendering unsafe HTML from imported values.

Implement source management for demo, file import, and CoreDNS configuration. Show enabled state, health status, last event time, processed count, last error, and visibility limitations. Require authorization for source configuration and imports where the project’s auth model requires it.

**Expected deliverables**

Import page/components, source management API/UI, upload validation, status polling or SSE, import-history view, safe fixtures, and tests.

**Acceptance criteria**

Users can select a supported file, preview it, submit it, see a truthful result, inspect rejected records, and distinguish imported events from demo/resolver events. Unsupported CoreDNS configuration is shown honestly.

**Validation commands**

```bash
.venv/bin/pytest backend/tests -q -k 'import or source'
cd frontend && npm test -- --run && npm run typecheck
```

**Completion report**

Report supported formats, sample import counts, source statuses, and limitations.

---

## Prompt 15 — Progressive Web App

**Objective**

Make the frontend installable while keeping sensitive event data out of indiscriminate caches.

**Instructions for Antigravity**

Configure Vite PWA tooling with manifest name `DNS Guard`, theme/background metadata matching the near-black design, suitable original icons, installable shell, and service worker. Cache static shell assets and versioned assets where appropriate. Do not cache DNS event responses, alert responses, administrative API responses, or credentials indiscriminately.

Add offline/disconnected messaging that states the backend may be unavailable and that PWA installation does not grant access to system DNS traffic. Document HTTPS requirements for cross-device installation and browser limitations. Ensure service-worker updates do not silently show stale security data.

**Expected deliverables**

Manifest, icons, PWA configuration, service worker, install/help UI if useful, offline states, documentation, and PWA checks.

**Acceptance criteria**

The app has valid manifest metadata and an installable shell where supported; offline mode is honest; sensitive APIs are not blindly cached; the app recovers when the backend returns.

**Validation commands**

```bash
cd frontend
npm run build
npm run typecheck
npm test -- --run
```

Inspect generated manifest/service-worker output and verify cache rules.

**Completion report**

Report manifest/icon files, cache policy, offline behavior, and browser-dependent limitations.

---

## Prompt 16 — Security hardening

**Objective**

Review and implement security controls appropriate to the actual deployment model without overstating protection.

**Instructions for Antigravity**

Implement or verify typed input validation, safe ORM queries, upload size/type limits, path-traversal prevention, strict configured CORS, secure generic errors, environment-managed secrets, privacy-conscious logs, authentication rate limiting where justified, bounded imports and analytics, safe domain/IP/timestamp/filter handling, and safe rendering of imported content.

If authentication is in scope, implement secure password hashing, login/logout/session handling, role checks, protected administrative actions, and audit records. If the current application is intentionally single-user/local and auth is not yet available, document that limitation prominently and do not claim production-grade access control. Never invent successful TLS, authorization, or external integrations.

Review dependencies and configuration for unsafe defaults. Keep observe-only behavior. Add a security checklist and update `SECURITY_PRIVACY.md`/`THREAT_MODEL.md` only where implementation evidence supports the change.

**Expected deliverables**

Security middleware/configuration, auth/authorization if implemented, upload/resource limits, audit coverage, dependency/configuration review, security tests, and updated limitations.

**Acceptance criteria**

Untrusted input is validated, secrets are not logged or committed, admin mutations are protected or honestly marked local-only, unsafe query/file paths are rejected, and security claims match actual implementation.

**Validation commands**

```bash
.venv/bin/ruff check backend
.venv/bin/pytest backend/tests -q -k 'auth or security or upload or audit'
cd frontend && npm audit --audit-level=high || true
```

Do not treat an advisory command’s exit status as proof of complete security.

**Completion report**

Report implemented controls, remaining deployment assumptions, and actual security-test evidence.

---

## Prompt 17 — Frontend and backend testing

**Objective**

Create a meaningful deterministic automated test suite rather than tests that only prove pages render.

**Instructions for Antigravity**

Cover normalization, event schemas, import parsing, malformed inputs, database operations, detection rules, score boundaries, severity mapping, alert creation/deduplication/status changes, API response schemas, pagination, filters, source status, exports, and SSE lifecycle where practical. Use deterministic fixtures, fixed clocks, isolated temporary databases, and no real malicious domains or production DNS access.

For the frontend, test route navigation, dashboard states, demo labels, filters/search, forms/imports, alert detail/status changes, API errors, reconnect/offline states, and mobile card variants. Use React Testing Library and Vitest or the compatible existing test stack.

Add coverage for negative cases and insufficient data. Do not weaken assertions merely to make tests pass.

**Expected deliverables**

Backend unit/integration tests, frontend component/integration tests, fixtures, test configuration, and updated `TESTING_PLAN.md` if commands differ.

**Acceptance criteria**

Required detection categories have positive and negative tests, API filters/pagination are covered, frontend error/loading states are covered, and the suite runs reproducibly on a fresh environment.

**Validation commands**

```bash
.venv/bin/pytest -q
.venv/bin/ruff check backend
cd frontend && npm test -- --run && npm run typecheck && npm run lint
```

**Completion report**

Report exact test counts and failures, not just a claim that tests exist.

---

## Prompt 18 — Integration and end-to-end verification

**Objective**

Verify the entire data flow from event source through persisted detection to dashboard presentation.

**Instructions for Antigravity**

Exercise: generate or import safe DNS events → validate and normalize → persist events → execute detection rules → store/group alerts → retrieve through APIs → display dashboard/event/alert/domain/client results → receive supported live updates. Include normal, NXDOMAIN, long-label, high-rate, indicator, and insufficient-data scenarios.

Verify frontend/backend contract alignment for fields, routes, timestamps, pagination, severity, status, errors, and SSE payloads. Verify alert status changes create audit history. Verify exports reflect filters. Verify demo events remain visibly separate from imported/resolver events.

Use the project’s actual browser/e2e tooling if available; otherwise use API integration tests plus a documented manual smoke flow. Do not mark a feature complete because a screen renders.

**Expected deliverables**

Integration/e2e tests, safe end-to-end fixture data, smoke script or documented procedure, defect fixes, and progress evidence.

**Acceptance criteria**

The complete supported path works in a clean local environment, test detections are explainable, persisted results survive restart, frontend shows the same values returned by the API, and failures are diagnosed rather than hidden.

**Validation commands**

```bash
.venv/bin/alembic upgrade head
.venv/bin/pytest -q
cd frontend && npm run build
```

Run the actual servers and documented smoke flow as well.

**Completion report**

Report each journey, data fixture, command, result, and remaining environment-dependent limitation.

---

## Prompt 19 — UI polish and responsive quality assurance

**Objective**

Correct visual and interaction defects against the provisional design system and product requirements.

**Instructions for Antigravity**

Review desktop, tablet, and 360–430px mobile layouts. Check typography hierarchy, spacing, surface hierarchy, borders, navigation/active states, table-to-card transformations, chart responsiveness, form validation, loading/empty/error/offline/disconnected states, keyboard navigation, focus indicators, contrast, reduced motion, console errors, broken routes, fake interactions, and placeholder copy.

Preserve the near-black Linear-inspired design principles while retaining DNS Guard-specific identity and semantic severity colors. Do not add marketing sections, copied Linear branding, gradients, glows, or gratuitous animations. Correct visible defects instead of merely documenting them.

**Expected deliverables**

Polished pages/components, responsive fixes, accessibility fixes, reduced-motion handling, and visual QA notes.

**Acceptance criteria**

No core view has horizontal overflow at target mobile widths; controls are touch/keyboard usable; severity meaning is not color-only; there are no obvious dead buttons, fake notifications, console errors, or broken routes.

**Validation commands**

```bash
cd frontend
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Use the project’s screenshot/browser checks where available and record viewport sizes inspected.

**Completion report**

Report viewports, defects corrected, accessibility observations, and any unresolved visual issue.

---

## Prompt 20 — Documentation and final delivery preparation

**Objective**

Make the repository understandable and runnable for an evaluator or new developer.

**Instructions for Antigravity**

Update or create documentation without overwriting original specifications unnecessarily. Ensure `README.md`, `ARCHITECTURE.md`, `API_SPEC.md`, `DATABASE_SCHEMA.md`, `DETECTION_RULES.md`, `DATA_SOURCES.md`, `SECURITY_PRIVACY.md`, `THREAT_MODEL.md`, `TESTING_PLAN.md`, and `DEPLOYMENT_GUIDE.md` describe actual implemented behavior.

Document prerequisites, environment setup, migrations, frontend/backend startup, scripts, tests/lint/build, demo workflow, supported CSV/JSON schema, concrete CoreDNS format if implemented, endpoint behavior, detection assumptions and false positives, PWA installation, source coverage limitations, security assumptions, troubleshooting, and future work. Add or update `.env.example` and sample fixtures. Include exact commands that work on the selected OS/toolchain.

Do not advertise unsupported live capture, automatic blocking, completed authentication, or unavailable integrations.

**Expected deliverables**

Accurate root README, updated technical documents, environment template, sample data, troubleshooting notes, and final runbook.

**Acceptance criteria**

A new developer can follow the docs to install, migrate, start, run the demo, import a fixture, inspect an alert, run tests, and understand coverage/security limitations.

**Validation commands**

Follow the documented fresh-setup procedure from a clean environment or temporary directory. Run every documented check command and correct drift.

**Completion report**

Report documents updated, exact setup flow verified, and any command that remains environment-specific.

---

## Prompt 21 — Final audit and completion report

**Objective**

Perform a factual release audit against every requirement in this file and leave the project runnable.

**Instructions for Antigravity**

Review every mandatory prompt and acceptance criterion. Inspect actual changed files. Run backend tests, Ruff, migrations, frontend tests, type checking, linting, production build, and the complete integration/smoke flow. Confirm source labels, demo indicator, API contracts, risk-score semantics, alert explanations, PWA cache policy, security controls, audit behavior, and mobile responsiveness.

Resolve failures and integration defects rather than concealing them. If a feature is incomplete or environment-dependent, mark it incomplete and explain the exact limitation. Do not claim a real resolver source, production auth, TLS, deployment, or external integration unless it was actually configured and verified.

Create or update `IMPLEMENTATION_PROGRESS.md` with final status for Prompts 1–21. Produce `FINAL_AUDIT.md` containing a table with each major acceptance area, evidence/command, status (`PASS`, `PARTIAL`, or `NOT IMPLEMENTED`), and notes. Ensure startup instructions are exact and the repository does not require undocumented repairs.

**Expected deliverables**

Final audited application, `IMPLEMENTATION_PROGRESS.md`, `FINAL_AUDIT.md`, clean documentation, passing or honestly reported checks, and exact startup commands.

**Acceptance criteria**

The project is runnable from documented setup, the primary data flow works, no major requirement is silently faked, all incomplete areas are disclosed, and the final report distinguishes executed evidence from assumptions.

**Validation commands**

Run the complete documented suite, including at minimum:

```bash
.venv/bin/alembic upgrade head
.venv/bin/ruff check backend
.venv/bin/pytest -q
cd frontend && npm run typecheck && npm run lint && npm test -- --run && npm run build
```

Also run the actual application and health/smoke checks using the documented ports.

**Completion report**

Finish with:

1. Exact application startup commands.
2. Files and modules created or changed.
3. Commands actually executed and their results.
4. Acceptance areas that passed.
5. Partial or incomplete areas with reasons.
6. Source coverage and observe-only limitations.
7. Any genuine blockers requiring future work.

Never state that a command passed unless its output was inspected.

---

## Required final state

The final repository must contain a functional integrated DNS Guard application—not merely attractive screens or disconnected modules—with frontend, backend, persistence, ingestion, explainable detection, alerts, analytics, source visibility, SSE where supported, PWA support, security controls, tests, fixtures, and accurate documentation. Future enhancements such as packet capture, automatic blocking, machine learning, commercial threat intelligence, and SIEM integrations remain explicitly outside the initial implementation unless separately approved and implemented with their own security review.
