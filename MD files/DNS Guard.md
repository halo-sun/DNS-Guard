# DNS Guard

DNS Guard is a responsive, installable network-monitoring prototype for observing authorized DNS event sources and producing explainable security findings. It is intended for undergraduate Computer Networks and Cybersecurity evaluation.

> A web application cannot independently inspect every DNS request on Windows, Android, or a network. DNS Guard only shows events delivered by configured sources.

## Scope
The initial product supports deterministic demo data, CSV/JSON import, and configurable CoreDNS log ingestion. It normalizes events, stores them, evaluates modular rules, groups related alerts, and presents a dashboard, live event monitor, alert investigation, domain/client views, analytics, data-source status, and administrative configuration.

## Development
1. Copy `.env.example` to a local environment file and provide development-only values.
2. Install frontend and backend dependencies using the lockfiles and documented toolchain.
3. Run the frontend and backend development commands.
4. Open the frontend and use the clearly labelled **Demo Mode** to generate safe sample events.
5. Run the test and lint commands before committing.

Exact commands are maintained in `DEPLOYMENT_GUIDE.md` as the toolchain is finalized.

## Safety and limitations
DNS Guard is observe-only. It does not block domains, change resolvers, capture packets, or claim enterprise-grade coverage. Clients using another resolver, DoH, or DoT may be invisible to a configured source. A suspicious-looking domain is not automatically malicious.

See `SECURITY_PRIVACY.md`, `THREAT_MODEL.md`, and `DATA_SOURCES.md` for operational limitations.