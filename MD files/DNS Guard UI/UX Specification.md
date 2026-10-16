# DNS Guard UI/UX Specification

## Visual language
Use a deep navy canvas, blue-gray surfaces, cyan/electric-blue primary accents, light text, muted secondary text, restrained red/amber/green severity cues, thin borders, and compact status typography. The tone is an instrument-panel security workspace, not a generic analytics template.

## Navigation
Desktop uses a collapsible left rail with Dashboard, Live DNS, Threat Alerts, Domain Explorer, Clients, Analytics, Detection Rules, Data Sources, and Settings. Mobile uses a drawer or compact bottom navigation for high-frequency destinations.

## Dashboard
Show total queries, suspicious events, open alerts, unique clients/domains, source health and last update, query activity, severity distribution, top domains, active clients, recent alerts, NXDOMAIN and anomaly summaries. Cards and chart elements link into filtered views.

## Investigation
Live DNS supports search, time range, client/domain/type/response/severity filters, pagination, refresh/live status, and mobile event cards. Alerts show severity, score, affected domain/client, time bounds, event count, evidence, rules, investigation steps, notes, status controls, and related events. Domain and client pages show histories, distributions, activity, and associated alerts.

## Interaction and accessibility
Use visible text plus icons for severity, keyboard-accessible controls, clear focus, semantic headings, touch-friendly targets, inline validation, empty/error/loading/offline states, and no hover-only actions. Never hide source limitations behind a tooltip.