# DNS Guard Data Sources

## Common event contract
A normalized event includes a unique ID, observed timestamp, client IP, optional client name, original and normalized domain, record type, response code/details, resolver or sensor ID, protocol, ingestion source, optional sizes/duration, ingestion timestamp, and provenance metadata. Missing fields remain null.

## Demo mode
The deterministic generator creates normal browsing, repeated queries, NXDOMAIN failures, long subdomains, high-volume clients, and suspicious-looking patterns. The UI displays a persistent **DEMO MODE** indicator. Demo events are never described as network observations.

## File import
CSV and JSON imports use the documented common field names, validate each row, show a preview and valid/invalid/duplicate counts, retain import history, and report structured errors. Uploads are size-limited and treated as untrusted input.

## CoreDNS logs
The adapter accepts an explicitly configured log format rather than assuming all resolver logs are identical. It extracts available client address, query name, record type, protocol, response code, size, and duration fields. Source status includes enabled state, last successful event, processed count, and last processing error.

## Coverage statement
A source reports only events it is authorized and configured to observe. Alternative resolvers, DNS-over-HTTPS, DNS-over-TLS, and source outages can create blind spots. The dashboard must display the active sources and their health so users can interpret coverage honestly.