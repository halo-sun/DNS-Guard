# DNS Guard Threat Model

## Assets
The primary assets are DNS event metadata, alert evidence, source credentials/configuration, user identities, administrative actions, and database integrity.

## Actors and threats
| Actor or condition | Threat | Controls |
|---|---|---|
| Unauthenticated remote user | Read or modify monitoring data | Authentication, authorization, secure sessions, CORS, rate limits |
| Malicious uploader | Parser abuse or oversized payloads | Size limits, schema validation, safe parsing, sandboxed processing |
| Compromised administrator | Hide or alter findings | Least privilege, audit trail, status history, visible source changes |
| Poisoned or malformed source | False findings or denial of service | Source validation, bounded processing, provenance, error isolation |
| Sensitive-data exposure | Browsing metadata leakage | Local-first defaults, retention controls, no external lookup by default, access controls |
| Detector overreach | Treat heuristic as proof | Evidence display, calibrated language, score disclaimer, analyst statuses |
| Source outage/blind spot | False confidence in coverage | Health status, last event, source list, limitations messaging |

## Trust boundaries
Boundaries exist between uploaded files and parsers, collectors and normalized events, backend and database, backend and browser, and administrators and configuration. Validate and authorize at every boundary.

## Residual risk
DNS Guard cannot infer traffic hidden by alternative resolvers or encrypted DNS paths, cannot prove intent from a domain alone, and cannot replace endpoint or enterprise security controls.