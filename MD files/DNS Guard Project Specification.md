# DNS Guard Project Specification

## Goal
Provide a trustworthy web/PWA interface for authorized DNS event monitoring, explainable rule-based detection, alert review, and source-health visibility.

## Required source layers
1. **Event sources:** deterministic demo generator, CSV/JSON import, and configurable CoreDNS logs.
2. **Monitoring engine:** validate, normalize, persist, detect, score, deduplicate, audit, and stream events.
3. **Web application:** dashboard, Live DNS, Threat Alerts, Domain Explorer, Clients, Analytics, Detection Rules, Data Sources, Settings, authentication, filtering, investigation, and export.

## Detection and scoring
Support known indicators, suspicious structure, possible tunneling, NXDOMAIN spikes, query-rate anomalies, and possible domain-generation activity. Findings must include matched rules, thresholds, observed values, evidence, and reasons. Scores range from 0–100 with Low 0–29, Medium 30–59, High 60–79, Critical 80–100.

## UX and platform
Use a deep navy security-operations visual system, persistent desktop navigation, responsive mobile cards and controls, installable PWA behavior, honest offline/reconnection states, accessible forms, and no horizontal overflow at common Android widths.

## Security posture
Authenticate and authorize administrative functions, hash passwords, protect sessions, validate inputs and uploads, restrict CORS, rate-limit authentication, audit changes, protect secrets, and remain observe-only by default.

## Quality bar
Persist data, derive live metrics from stored data, support pagination and validated filters, document monitoring limitations, and cover normalization, ingestion, detection, API, UI, and primary end-to-end journeys with automated tests.