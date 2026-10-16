# DNS Guard Architecture

## Logical flow
```text
Configured source -> collector -> parser/normalizer -> persistence -> detector
      -> risk scorer -> alert manager -> REST API + SSE -> responsive dashboard
```

## Frontend
React/TypeScript/Vite application with route-level pages, reusable cards/tables/charts, TanStack Query for server state, Zod for input validation, and PWA shell support. The frontend never captures DNS traffic or runs authoritative detection.

## Backend
FastAPI exposes `/api/v1`. Collectors adapt demo, file, and CoreDNS inputs into a common event schema. Services own normalization, deduplication, detection, scoring, alert grouping, analytics, export, audit, and SSE publication. SQLAlchemy models and Alembic migrations own persistence.

## Boundaries
- **Source adapters** know source formats, not UI concerns.
- **Normalization** produces canonical events and structured import errors.
- **Detection** consumes canonical events and configured rules, returning evidence.
- **Persistence** stores source facts and analysis results separately enough to preserve provenance.
- **API** exposes bounded, authorized use cases rather than unrestricted queries.
- **UI** renders server state and clearly identifies demo mode.

## Runtime modes
Demo mode is deterministic and visibly marked. Import mode is user-initiated and reports valid/invalid counts. Live mode reports configured source, last event, processing errors, and coverage limitations. All modes remain observe-only.