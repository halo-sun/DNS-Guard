# Security and Privacy

DNS queries can reveal browsing metadata and must be handled as sensitive operational data. DNS Guard collects only events supplied by configured authorized sources, stores only fields needed for monitoring and investigation, and supports configurable retention.

Administrative functions require authentication, role checks, secure password hashing, protected sessions, CSRF defenses where relevant, strict CORS, rate-limited login, validated inputs, safe file handling, bounded queries, and generic error responses. Credentials, API keys, and external DSNs are environment-managed and never committed.

The default policy is observe-only. DNS Guard does not block domains, alter operating-system or router resolvers, run intrusive packet capture, or disrupt connectivity. External reputation lookup is opt-in, privacy-reviewed, source-labelled, and disabled by default.

Security-relevant changes—authentication events, rule/threshold changes, allowlists, source configuration, imports, exports, and alert status changes—create audit records. Users are told that an IP address does not uniquely identify a human and that heuristic alerts are not incident confirmation.