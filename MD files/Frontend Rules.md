# Frontend Rules

- Use React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, Lucide, Zod, and PWA tooling.
- Keep pages thin; place reusable UI in `components/`, API calls in `lib/api/`, query hooks in `lib/queries/`, and domain types in `types/`.
- Treat backend responses as the source of truth in live mode. Demo fixtures must carry an explicit `demo: true` or equivalent source marker.
- Model loading, empty, error, stale, offline, and reconnecting states for every data-backed screen.
- Make severity understandable with text and icons, never color alone. Preserve keyboard navigation, visible focus, semantic headings, and touch targets.
- Avoid horizontal overflow at 360–430px. Tables become cards on narrow screens.
- Validate forms with Zod before submission and display actionable server errors without leaking internals.
- Do not put DNS capture or detection logic in the browser. The frontend consumes API/SSE events only.
- Never cache sensitive DNS events or administrative responses in the service worker.
- Add a route entry to `public/manus-routes.json` whenever a page route is added.