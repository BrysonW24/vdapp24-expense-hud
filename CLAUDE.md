# vdapp24 — Expense HUD

Personal finance dashboard with advanced visualizations. Client-side only — all data stays local.

## Stack
- **Framework**: Vite + React 19 (NOT Next.js)
- **Database**: Dexie (IndexedDB) — fully client-side
- **Queries**: TanStack React Query
- **Charts**: D3 + Recharts
- **CSV Import**: papaparse
- **Cloud**: Supabase (optional sync)
- **Styling**: Tailwind CSS 4

## Unique Patterns
- **Vite + React** — not Next.js, no SSR
- **Local-first** — Dexie/IndexedDB, all data stays on device
- **CSV bank import** — parses Australian bank transaction CSVs via papaparse
- **D3 + Recharts** for financial visualizations
- **No Prisma** — no server-side database

## Dev
```bash
npm install && npm run dev
```
