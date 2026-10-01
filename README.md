# PathPulse — Website Behaviour Tracker

A modern, self-hosted website behaviour analytics tool. It tracks how visitors interact with a site — clicks, cursor movement, scrolling, attention, frustration — and turns those signals into **live dashboards, heatmaps, scroll maps and full session replays**.

This project is an upgraded, full-stack evolution of the single-file [website-behaviour-tracker](https://github.com/ahmedramzan-ai/website-behaviour-tracker) concept: same idea, dramatically deeper tracking, server-side persistence and a real analytics product UI.

---

## ✨ Features

### Tracking (what gets captured)

| Signal | Description |
| --- | --- |
| **Clicks** | Element tag, id, text, classes, page + viewport coordinates, and whether the target was interactive |
| **Rage clicks** | Automatic detection of 3+ rapid clicks in the same spot — a classic frustration signal |
| **Dead clicks** | Clicks on non-interactive elements — hints at missing affordances |
| **Cursor movement** | Throttled mouse tracking with distance + velocity stats |
| **Scroll behaviour** | Scroll events, max depth %, per-section reach |
| **Section dwell** | Time spent in each page section (IntersectionObserver based) |
| **Engaged vs idle time** | 15s no-activity idle detection; engagement time excludes idle and hidden-tab time |
| **Tab visibility** | Tab switches away and back |
| **Form interactions** | Field focus/blur (names only, never content), keystroke counts, submissions |
| **Navigation** | In-page nav clicks with destination |
| **Device & context** | Viewport, screen, device class (desktop/tablet/mobile), language, platform, referrer, new vs returning visitor |

Privacy-first by design: anonymous visitor ids, **no cookies, no PII, no keystroke content**.

### Analytics dashboard

- **Live monitor** — active sessions, real-time event stream (3s polling), rage-click alerts, per-visitor "watch" buttons
- **Overview** — KPI cards (engagement, scroll depth, clicks/session, rage, dead clicks, form submits), activity timeline, scroll-depth histogram, device split, section dwell chart, most-clicked elements, frustration signals
- **Heatmaps** — true canvas **density heatmaps** (alpha accumulation + colour LUT), click dot map, and a **scroll reach map** showing how far visitors get, rendered over a scaled clone of the real page, with desktop/tablet/mobile filters and opacity control
- **Sessions** — filterable table (device, live-only, search) with quality badges and one-click delete
- **Session replay** — watch any recorded visit as a video: animated cursor, scroll replay, click/rage pings, play/pause, 1–8× speed, scrubable timeline with click markers, synced event stream
- **Sample data** — one click seeds 12 realistic simulated sessions (buyers, browsers, rage-clickers, form fillers…) so every view is instantly explorable; coordinates are calibrated against the real page layout
- **Dark mode**, responsive layout, live REC indicator and click-dot overlay on the tracked site

---

## 🧱 Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4 + shadcn/ui** (teal/amber design system, dark mode via `next-themes`)
- **Prisma ORM + SQLite** (zero-config persistence in `db/custom.db`)
- **TanStack Query** (live polling data flow)
- **Recharts** (analytics charts)
- **Lucide** icons, canvas 2D heatmap engine (no external heatmap lib)

---

## 🚀 Getting started

### Prerequisites

- [Node.js 18+](https://nodejs.org) or [Bun](https://bun.sh)

### Install & run

```bash
# 1. install dependencies
bun install        # or npm install

# 2. create the database (db/custom.db)
bun run db:push    # or npx prisma db push

# 3. start the dev server
bun run dev        # or npm run dev
```

Open <http://localhost:3000> in your browser.

### 60-second tour

1. You land on the **Aurora Beans demo storefront** — this page is fully tracked. Click things, scroll, fill the contact form.
2. Notice the **REC badge** and live stats (engaged time, clicks, depth) in the top bar, plus amber dots marking your clicks.
3. Switch to **Dashboard** → the **Live** tab shows your own session in real time.
4. Press **Load sample data** to add 12 simulated visitors, then explore:
   - **Overview** for aggregate charts,
   - **Heatmaps** for click density and scroll reach,
   - **Sessions** → **Replay** to watch a recorded visit,
   - the **Watch** buttons on the Live tab to jump straight into a replay.
5. Toggle **dark mode** from the top bar any time.

### Production build

```bash
bun run build && bun run start
```

---

## 🗂 Project structure

```
src/
├── app/
│   ├── page.tsx                  # App shell: site/dashboard views + tracker wiring
│   ├── layout.tsx                # Theme provider, metadata, toaster
│   ├── globals.css               # Teal design tokens, scrollbars, animations
│   └── api/
│       ├── track/route.ts        # POST — event ingest (session upsert)
│       ├── analytics/route.ts    # GET  — aggregates for dashboard (KPIs, charts, heatmap points)
│       ├── sessions/route.ts     # GET/DELETE — session list / clear all
│       ├── sessions/[id]/route.ts# GET/DELETE — full session + events
│       └── seed/route.ts         # POST/DELETE — sample data generator (layout-calibrated)
├── lib/tracker/
│   ├── tracker.ts                # PathPulseTracker SDK (capture, batching, sendBeacon)
│   ├── types.ts                  # Shared types (events, sessions, DTOs)
│   ├── heatmap.ts                # Canvas density heatmap + reach colour engine
│   └── format.ts                 # Formatting helpers
└── components/
    ├── demo/DemoSite.tsx         # Aurora Beans storefront (live + static modes)
    └── dashboard/
        ├── Dashboard.tsx         # Tab shell, queries, seed/clear
        ├── LiveTab.tsx           # Real-time monitor
        ├── OverviewTab.tsx       # KPIs + charts
        ├── HeatmapTab.tsx        # Heatmap / dots / scroll reach
        ├── SessionsTab.tsx       # Session table
        ├── ReplayTab.tsx         # Session replay player
        └── shared.tsx            # KPI cards, event meta, badges
prisma/schema.prisma              # TrackedSession + TrackedEvent models
```

---

## 🔌 API reference

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/track` | POST | Ingest a batch: `{ sessionId, visitorId, startedAt, ended, device, returning, summary, events[] }` |
| `/api/analytics` | GET | Aggregates: totals, active sessions, recent events, rage events, top targets, scroll histogram, devices, section dwell, timeline, heatmap points |
| `/api/sessions?limit=100` | GET | Session list with live status and event counts |
| `/api/sessions` | DELETE | Clear all data |
| `/api/sessions/:id` | GET | Full session detail + ordered events |
| `/api/sessions/:id` | DELETE | Delete one session |
| `/api/seed` | POST `{count}` | Generate simulated sessions |
| `/api/seed` | DELETE | Alias for clearing all data |

A `window.PathPulse` handle is exposed in the browser console:

```js
window.PathPulse.stats()   // live session stats
window.PathPulse.flush()   // force-upload the event buffer
```

---

## 🧠 How it works

1. **Capture** — `PathPulseTracker` attaches to the tracked container and listens (capture phase) for clicks, moves, keys, focus, submit, scroll, visibility and resizes. Coordinates are recorded relative to the page content, so replays and heatmaps stay aligned at any viewport size.
2. **Enrichment** — each event is timestamped (`t` ms since session start) and enriched: dead/rage flags, section context, element labels, viewport geometry (`sw`/`sh`).
3. **Ship** — events are batched and POSTed every 4 seconds; `navigator.sendBeacon` guarantees delivery when the tab closes.
4. **Store** — the API upserts the session summary and appends events in SQLite (capped at 20k events per session).
5. **Visualise** — the dashboard polls aggregates; the heatmap normalises click points per layout width; the replay interpolates cursor position and scroll position between recorded events.

---

## 🔒 Privacy

- Anonymous, rotating per-browser visitor id (localStorage) — no cookies
- No IP storage, no keystroke content, no form input values
- Rage/dead click detection runs client-side; only the flags are uploaded
- All data stays in your own SQLite file — delete everything with one button

---

## 🛠 Customising

- **Track your own page**: wrap any page in a container `div` and pass it to `PathPulseTracker.attach(el)` (see `src/app/page.tsx`). Mark sections with `data-section="..."` for dwell analytics.
- **Branding**: design tokens live in `src/app/globals.css` (`--primary`, chart colours).
- **Tracking knobs**: idle timeout, throttle intervals and buffer caps are constants at the top of `src/lib/tracker/tracker.ts`.

---

## License

MIT — do whatever you like, attribution appreciated.
