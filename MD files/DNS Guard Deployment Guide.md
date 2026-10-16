# DNS Guard Deployment Guide

## Local development
Use a supported Node.js toolchain for the React frontend and Python 3.12-compatible environment for FastAPI. Copy `.env.example` to a local ignored environment file. Start the backend on a loopback address and the frontend through the project development command. Apply migrations before using persistent features.

## Configuration
Set database URL, session/authentication secrets, allowed origins, upload limits, retention period, and explicitly configured source settings through environment management. Never place credentials in source, fixtures, client bundles, or uploaded sample logs.

## LAN or remote access
Local loopback is the safe default. Before Android/LAN testing, deliberately bind the service, enable authentication, restrict firewall exposure, configure HTTPS for cross-device PWA installation, and verify CORS and cookie behavior. Do not expose administrative endpoints unauthenticated.

## Production
Build the frontend with a pinned lockfile and serve it through the configured web runtime. Run the backend with a production process manager, apply reviewed migrations, expose an unauthenticated health path, configure backups and retention, and use secure headers without blocking the embedded Preview iframe. Keep APIs and sensitive responses non-cacheable.

## Operations checklist
Confirm source health, last event time, audit logging, error monitoring, retention behavior, backup/restore procedure, HTTPS, authentication rate limits, and demo-mode labelling. Validate that published metrics come from stored application data and that offline UI states do not imply monitoring continues in the browser.

## Limitations
Deployment does not grant access to all network DNS traffic. Coverage remains limited to configured authorized sources, and DNS Guard remains observe-only unless a future separately authorized integration is designed, audited, and explicitly enabled.