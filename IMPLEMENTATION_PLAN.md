# DNS Guard — Implementation Plan

## 1. Executive Summary & Audit Baseline
DNS Guard is an autonomous, responsive, installable network-monitoring application for observing authorized DNS event sources, normalizing telemetry, running explainable heuristic threat detection, generating structured alerts, and presenting real-time investigations through a Linear-inspired security operations dashboard.

### Audit Findings
- **Workspace**: `C:\Users\Admin\OneDrive\Documents\CN CP`
- **Specification Directory**: `C:\Users\Admin\OneDrive\Documents\CN CP\MD files`
- **Specifications Inspected**:
  - `DNS Guard — Autonomous Implementation Prompts.md` (Implementation Playbook, 21 Prompts)
  - `DESIGN-linear.app.md` (Approved Visual System & Design Tokens)
  - `DNS Guard Architecture.md` (Logical Flow, Boundaries, Runtime Modes)
  - `DNS Guard Project Specification.md` (Scope, Modules, Evaluation Criteria)
  - `DNS Guard API Specification.md` (REST & SSE Endpoints, Error Envelopes)
  - `DNS Guard Database Schema.md` (SQLite/PostgreSQL schema, Indexes, Models)
  - `DNS Guard Detection Rules.md` (Heuristic Rules, Contributions, Scoring 0–100, Grouping)
  - `DNS Guard Data Sources.md` (Canonical Contract, Demo Mode, CSV/JSON Import, CoreDNS)
  - `DNS Guard UI/UX Specification.md` (Navigation, Layout, Mobile Views, Accessibility)
  - `Backend Rules.md` & `Frontend Rules.md` (Engineering Guidelines, Conventions)
  - `Security Rules.md` & `Security and Privacy.md` (Observe-only, Secrets, Auth, PWA Cache)
  - `Testing Rules.md` & `DNS Guard Testing Plan.md` (Testing Matrix, Fixtures, Coverage)
  - `DNS Guard Deployment Guide.md` & `DNS Guard Threat Model.md`

### Design Specification Reconciliation
`DESIGN-linear.app.md` is present in the project specification directory. It defines the exact visual system:
- **Canvas**: `#010102` (deepest dark surface)
- **Primary Accent**: `#5e6ad2` (lavender-blue), Hover: `#828fff`, Focus: `#5e69d1`
- **Surfaces**: Surface 1 (`#0f1011`), Surface 2 (`#141516`), Surface 3 (`#18191a`), Surface 4 (`#191a1b`)
- **Hairline Borders**: `#23252a`, Strong Border: `#34343a`, Tertiary Border: `#3e3e44`
- **Text / Ink**: Primary `#f7f8f8`, Muted `#d0d6e0`, Subtle `#8a8f98`, Tertiary `#62666d`
- **Semantic Severity**:
  - Low (0–29): Restrained Green / Muted Blue `#27a644` / `#4a90e2`
  - Medium (30–59): Amber `#d97706` / `#f59e0b`
  - High (60–79): Orange-Red `#ea580c`
  - Critical (80–100): Crimson Red `#dc2626`
- **Typography**: Inter / Geist / system sans with measured letter spacing, tabular figures for IP/timestamps.

---

## 2. Architecture & Data Flow

```text
+---------------------------------------------------------------------------------+
| Authorized Event Sources                                                        |
| [Deterministic Demo Generator] [CSV/JSON File Upload] [Configured CoreDNS Logs] |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
| Event Collection & Normalization (Module 1)                                     |
| - Validation: IP format, FQDN validation, timestamp parsing, size bounds       |
| - Normalization: lowercased domain, strip trailing dot, UTF-8/punycode          |
| - Fingerprint generation & deduplication                                       |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
| Persistent Storage (SQLite / PostgreSQL-ready via SQLAlchemy & Alembic)        |
| - Tables: dns_events, alerts, detection_rules, data_sources, allowlist_entries,  |
|           audit_logs, imports, users                                            |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
| Threat Detection & Risk Scoring Engine (Module 2)                              |
| - Rules: INDICATOR_MATCH (80), HIGH_ENTROPY (20), LONG_LABEL (15),              |
|          ENCODED_LABEL (20), DNS_TUNNEL_PATTERN (35), NXDOMAIN_SPIKE (25),     |
|          QUERY_RATE_ANOMALY (25), DGA_PATTERN (30)                              |
| - Allowlist precedence engine (authoritative indicators never suppressed)       |
| - Score calculation: min(100, sum(contributions))                               |
| - Grouping: key by rule_id:client_ip:normalized_domain:window                   |
| - Alert persistence with evidence snapshot & recommended actions                |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
| REST API & Real-Time SSE (FastAPI v1)                                           |
| - Endpoints: /dashboard/summary, /events, /alerts, /domains, /clients,         |
|              /analytics, /imports, /sources, /rules, /stream/events, /auth      |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
| Responsive Frontend (React 18/19 + TypeScript + Vite + Tailwind CSS + PWA)     |
| - Linear dark theme, TanStack Query, Recharts, Lucide icons                     |
| - Pages: Overview, Live DNS, Threat Alerts, Domain Explorer, Clients,           |
|          Analytics, Detection Rules, Data Sources/Import, Settings              |
+---------------------------------------------------------------------------------+
```

---

## 3. Directory Layout
```text
c:\Users\Admin\OneDrive\Documents\CN CP\
├── MD files/                         # Original specifications (preserved untouched)
├── frontend/                         # Vite + React + TypeScript + Tailwind PWA
│   ├── public/
│   │   ├── manus-routes.json
│   │   └── icons/
│   ├── src/
│   │   ├── components/               # Reusable primitives, cards, tables, charts
│   │   ├── hooks/                    # SSE stream hook, responsive hooks
│   │   ├── lib/
│   │   │   ├── api/                  # Centralized typed API client
│   │   │   └── queries/              # TanStack Query hooks
│   │   ├── pages/                    # 9 main route views + details
│   │   ├── types/                    # Domain TypeScript schemas
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                 # CSS variables for Linear tokens
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                      # FastAPI v1 route routers
│   │   ├── auth/                     # Session, JWT, user authentication & audit
│   │   ├── collectors/               # Demo generator, CSV/JSON parser, CoreDNS
│   │   ├── normalization/            # Domain, IP, timestamp canonicalization
│   │   ├── db/                       # SQLAlchemy models, session factory
│   │   ├── detection/                # Modular detection rules, risk scorer, grouping
│   │   ├── schemas/                  # Pydantic schemas (event, alert, import, etc.)
│   │   ├── services/                 # Business logic, query engine, analytics, exports
│   │   ├── streaming/                # SSE event bus and connection manager
│   │   ├── config.py                 # Pydantic settings
│   │   └── main.py                   # FastAPI app entrypoint
│   └── tests/                        # Pytest suite (unit, integration, detectors)
├── migrations/                       # Alembic database migrations
├── sample-data/                      # Synthetic event fixtures, safe resolver logs
├── scripts/                          # Development scripts & test helpers
├── pyproject.toml
├── .env.example
├── .gitignore
├── IMPLEMENTATION_PLAN.md
└── IMPLEMENTATION_PROGRESS.md
```

---

## 4. Phased Implementation Roadmap (Prompts 1 – 21)

1. **Prompt 1**: Repository audit & implementation baseline. (Complete)
2. **Prompt 2**: Repository structure, python environment, frontend project initialization.
3. **Prompt 3**: Design tokens, typography, surfaces, and accessible UI primitives.
4. **Prompt 4**: Frontend app shell, navigation (sidebar + mobile drawer), route structure.
5. **Prompt 5**: DNS Guard dashboard with deterministic demonstration mode.
6. **Prompt 6**: Backend foundation, configuration, FastAPI app, health endpoint.
7. **Prompt 7**: Database models, SQLAlchemy entities, Alembic migrations.
8. **Prompt 8**: Event collection & normalization pipeline, demo, CSV/JSON, CoreDNS.
9. **Prompt 9**: Threat detection engine, modular rules, risk scoring, alert grouping.
10. **Prompt 10**: Alerts, event queries, domain & client exploration API + UI.
11. **Prompt 11**: Analytics, historical aggregations, CSV exports.
12. **Prompt 12**: REST API integration: wire frontend pages to backend APIs.
13. **Prompt 13**: Real-time SSE streaming for live events and alerts.
14. **Prompt 14**: Ingestion management & CSV/JSON file import interface.
15. **Prompt 15**: Progressive Web App (manifest, icons, safe caching).
16. **Prompt 16**: Security hardening (validation, CORS, audit logs, rate limits).
17. **Prompt 17**: Comprehensive backend & frontend automated tests.
18. **Prompt 18**: Integration & end-to-end verification.
19. **Prompt 19**: UI polish & responsive QA (desktop, tablet, 360–430px mobile).
20. **Prompt 20**: Documentation, runbook, sample data, setup instructions.
21. **Prompt 21**: Final release audit and completion report.
