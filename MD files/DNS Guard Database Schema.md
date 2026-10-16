# DNS Guard Database Schema

The initial database is SQLite with SQLAlchemy/Alembic migrations and a PostgreSQL-compatible design. Store timestamps in UTC and add indexes for time, normalized domain, client address, alert status, and source.

| Entity | Important fields | Notes |
|---|---|---|
| `users` | id, email, password_hash, role, active, created_at, last_login_at | No plaintext passwords; unique email. |
| `dns_events` | id, observed_at, ingested_at, client_ip, client_name, original_domain, normalized_domain, record_type, response_code, response_details, resolver_id, protocol, source_id, query_size, response_size, duration_ms, fingerprint | Preserve provenance and nullable fields. |
| `alerts` | id, grouping_key, title, category, severity, risk_score, status, client_ip, normalized_domain, first_seen_at, last_seen_at, related_event_count, evidence_json, matched_rules_json, notes | Group bursts without losing counts or time bounds. |
| `detection_rules` | id, rule_id, name, category, description, enabled, contribution, threshold_json, updated_at | Version or snapshot rule inputs used for a finding. |
| `data_sources` | id, type, name, config_metadata, enabled, health_status, last_event_at, last_error, event_count | Never store credentials in metadata. |
| `allowlist_entries` | id, pattern, kind, reason, enabled, created_by, created_at | Explicit precedence against heuristic rules. |
| `audit_logs` | id, user_id, action, resource_type, resource_id, metadata_json, created_at | Append-only security history. |
| `imports` | id, source_name, file_hash, status, accepted_count, rejected_count, duplicate_count, errors_json, created_at | Supports repeat-import diagnostics. |

Foreign keys and deletion policy must preserve investigation records. Prefer soft disablement for users, sources, rules, and allowlists. Use migration scripts for every schema change.