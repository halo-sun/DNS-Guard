# Project Conventions

## Purpose
DNS Guard is a trustworthy DNS-monitoring and explainable threat-detection prototype. Documentation and code must distinguish **observed facts**, **heuristic findings**, and **confirmed threat intelligence**.

## Repository layout
- `frontend/`: React, TypeScript, Vite, responsive PWA interface.
- `backend/`: FastAPI application, services, schemas, authentication, ingestion, detection, and persistence.
- `tests/`: backend, frontend, integration, and fixture-based tests.
- `sample-data/`: synthetic DNS events and safe resolver-log fixtures only.
- `migrations/`: versioned database migrations.
- `.env.example`: variable names and safe development defaults; never real secrets.

## General rules
1. Prefer small, composable modules over large route or component files.
2. Keep normalization and detection framework-independent where practical.
3. Store and transport timestamps in UTC; localize only in the UI.
4. Preserve source values needed for investigation; never fabricate missing fields.
5. Use explicit names such as `normalized_domain`, `observed_at`, `ingestion_source`, and `risk_score`.
6. Label all simulated behavior as demo behavior in UI and docs.
7. Never describe a risk score as a probability of maliciousness.
8. Avoid dependencies without a documented need.
9. Update specifications and tests when behavior changes.
10. Never commit secrets, real browsing metadata, private credentials, or generated output.

## Change workflow
Read the relevant specification first. Implement one vertical slice at a time: interface, API/service, persistence, validation, and tests. Run formatting, linting, type checks, and targeted tests before broad tests. Record known limitations rather than hiding incomplete integrations.

## Git and review
Use focused imperative commits, for example `Add NXDOMAIN spike detector`. Reviews should state data-flow impact, security impact, migration needs, and test evidence.