# Expense HUD

Personal finance dashboard with advanced visualizations — built with React 19, Vite, and D3.

## Overview

Expense HUD is a client-side personal finance app that imports bank transactions (CSV) from Australian banks and provides rich visual analysis. All data stays local via IndexedDB (Dexie).

## Tech Stack

- **Framework:** React 19 + Vite 7
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4
- **Visualizations:** D3.js + Recharts
- **Storage:** Dexie (IndexedDB) — fully offline, no backend
- **State:** Zustand 5
- **Routing:** React Router 7
- **CSV Parsing:** PapaParse

## Features

- Import CSV statements from ANZ, CommBank, ING, NAB, Up, Westpac
- Auto-categorization of transactions
- Dashboard with spending overview
- Visualization gallery:
  - Financial ECG, Subscription Orbit, Time Tunnel
  - Money Particles, Spending DNA, Time Lapse Replay
  - Merchant Dependency Network, Income/Expense Energy Flow
  - Impulse vs Intent, Category Momentum, Lifestyle Drift
  - Runway Burn, Interest Sensitivity, Category Shock
  - Financial Mood Map, Future You projection
- Net worth tracking (assets + liabilities)
- Property portfolio tracking
- FIRE calculator + forecasting
- Debt payoff simulator
- Goal tracking
- Agent-style spending alerts

## Getting Started

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── visualizations/   # All chart/viz components
│   │   ├── behaviour/    # Spending pattern analysis
│   │   ├── emotional/    # Mood + projection charts
│   │   ├── experimental/ # Particle + DNA + replay
│   │   ├── network/      # Flow + dependency graphs
│   │   ├── predictive/   # Forecasting charts
│   │   ├── spatial/      # City + galaxy + river views
│   │   ├── tables/       # Transaction tables + filters
│   │   └── time/         # Time-series visualizations
│   ├── layout/           # AppShell, Header, Sidebar, BottomNav
│   └── ui/               # Shared UI primitives
├── db/                   # Dexie database + seeds
├── hooks/                # Data hooks (transactions, goals, etc.)
├── lib/                  # Parsers, analytics, categoriser
├── pages/                # Route pages
├── stores/               # Zustand stores
└── types/                # TypeScript types
```



## License

Private — Vivacity Digital
