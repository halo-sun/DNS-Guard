# DNS Guard Detection Rules

Detection is modular, deterministic, configurable, and explainable. Each finding records rule ID, category, enabled state, threshold, observed value, evidence fields, and a human-readable reason. Findings are not proof of malware.

| Rule | Category | Example signal | Default contribution |
|---|---|---|---:|
| `INDICATOR_MATCH` | Known threat indicator | Domain matches a configured local/test indicator list | 80 |
| `LONG_LABEL` | Suspicious structure | Label exceeds configured length | 15 |
| `ENCODED_LABEL` | Suspicious structure | Base32/base64-like character distribution and label shape | 20 |
| `HIGH_ENTROPY` | Suspicious structure | Label entropy exceeds configured heuristic threshold | 20 |
| `DNS_TUNNEL_PATTERN` | Possible tunneling | Repeated long encoded labels plus rate/record-type evidence | 35 |
| `NXDOMAIN_SPIKE` | Failure anomaly | Client/domain rate exceeds window threshold | 25 |
| `QUERY_RATE_ANOMALY` | Volume anomaly | Client query count exceeds absolute/configured baseline | 25 |
| `DGA_PATTERN` | Domain-generation activity | Randomness plus many distinct domains in a short window | 30 |

A single long label or TXT query is insufficient for a tunneling alert. Combine evidence and show the contributing features. Allowlist entries reduce applicable heuristic findings according to explicit precedence; authoritative indicator matches are not silently suppressed.

Risk score is `min(100, sum(enabled_rule_contributions))`. Severity maps to Low 0–29, Medium 30–59, High 60–79, and Critical 80–100. These are application bands, not probability estimates. Group alerts by rule/client/domain/time window and maintain first seen, last seen, and event count. Supported statuses are New, Under Investigation, Benign / False Positive, Confirmed Suspicious, and Closed.