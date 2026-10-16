# Security Rules

- DNS Guard is observe-only by default. Never block domains, alter resolver settings, modify routers, or disrupt connectivity.
- Require authentication and server-side authorization for administrative actions, rule changes, imports, source configuration, exports, and alert status updates.
- Hash passwords with a modern adaptive password hash; never store plaintext credentials or API secrets.
- Use secure HTTP-only cookies where cookie sessions are used, with correct cross-site attributes for HTTPS Preview and CSRF protection where applicable.
- Apply strict CORS, request-size limits, upload validation, rate limits on authentication, and safe generic error responses.
- Treat DNS names as potentially sensitive browsing metadata. Do not send them to external reputation services unless explicitly configured and disclosed.
- Store secrets in environment/configuration management, not source control. Keep `.env.example` safe.
- Audit security-relevant configuration changes, imports, source changes, authentication events, and alert status transitions.
- Do not imply an IP identifies a person. Do not label heuristics as confirmed malware.
- Default local bindings to loopback; deliberate LAN exposure requires authentication, HTTPS where appropriate, and firewall review.