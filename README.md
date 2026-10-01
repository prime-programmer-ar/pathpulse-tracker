# PathPulse — Website Behaviour Tracker

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

> 🚀 **Live demo:** _[Add your Render URL here after deployment]_

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
- **Heatmaps** — true canvas **density heatmaps** (alpha accumulation + colour LUT, additive glow rendering that pops on the dark demo page), click dot map, and a **scroll reach map** showing how far visitors get, rendered over a scaled clone of the real page, with desktop/tablet/mobile filters and opacity control
- **Sessions** — filterable table (device, live-only, search) with quality badges and one-click delete
- **Session replay** — watch any recorded visit as a video: animated cursor, scroll replay, click/rage pings, play/pause, 1–8× speed, scrubable timeline with click markers, synced event stream
- **Sample data** — one click seeds 12 realistic simulated sessions (buyers, browsers, rage-clickers, form fillers…) so every view is instantly explorable; coordinates are calibrated against the real page layout
- **Dark mode**, responsive layout, live REC indicator and click-dot overlay on the tracked site

---

## 🧱 Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4 + shadcn/ui** (teal/amber dashboard design system, dark mode via `next-themes`)
- **Glassmorphism demo storefront** (backdrop-blur glass panels over an animated aurora gradient + starfield, see `src/app/globals.css`)
- **Prisma ORM + SQLite** (zero-config persistence in `db/custom.db`)
- **TanStack Query** (live polling data flow)
- **Recharts** (analytics charts)
- **Lucide** icons, canvas 2D heatmap engine (no external heatmap lib)

---

## 🚀 Getting started

### Prerequisites

- **Node.js 18+** (Node 20 LTS recommended) — install from [nodejs.org](https://nodejs.org) or with `nvm install 20`
  **or** **Bun 1.0+** — install from [bun.sh](https://bun.sh)
- Git (to clone the repo) — or download the project as a ZIP
- That's it: **no external database, no API keys, no `.env` required**. Persistence uses a bundled SQLite file.

Works the same on **macOS, Windows and Linux**.

### 1) Get the code

```bash
git clone <your-repo-url> pathpulse
cd pathpulse
# (or unzip the downloaded archive and cd into it)
```

### 2) Install dependencies

```bash
npm install        # npm
# or
bun install        # bun — noticeably faster
# or
pnpm install       # pnpm and yarn also work
```

### 3) Create the database

```bash
npx prisma db push     # npm / pnpm users
bunx prisma db push    # bun users
```

This creates `db/custom.db` and the `TrackedSession` + `TrackedEvent` tables. The Prisma datasource is preconfigured in `prisma/schema.prisma`, so no environment variables are needed.

<details>
<summary>Optional: custom database location or MySQL/Postgres</summary>

- **Move the SQLite file**: set `DATABASE_URL="file:./wherever/you/want.db"` in a `.env` file at the project root, then re-run `npx prisma db push`.
- **Switch engine**: replace the `datasource db { provider = "sqlite" }` block in `prisma/schema.prisma` with `postgresql` or `mysql` and a matching `DATABASE_URL`, then run `npx prisma db push` again. The rest of the app is engine-agnostic.

</details>

### 4) Start the dev server

```bash
npm run dev
# or
bun run dev
```

Open <http://localhost:3000> — the demo site is tracked from your very first click.

### Production build (optional)

```bash
npm run build && npm run start
# or
bun run build && bun run start
```

### Run it anywhere — checklist

| Step | Command (npm) | Command (bun) |
| --- | --- | --- |
| Install | `npm install` | `bun install` |
| Database | `npx prisma db push` | `bunx prisma db push` |
| Develop | `npm run dev` | `bun run dev` |
| Build | `npm run build` | `bun run build` |
| Serve | `npm run start` | `bun run start` |

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Port 3000 is already in use` | Stop the other process, or run `npm run dev -- -p 3001` and open <http://localhost:3001> |
| `PrismaClient did not initialize` / schema errors | Re-run `npx prisma db push` and restart the dev server so the client regenerates |
| Install fails on Node < 18 | Upgrade Node (`nvm install 20 && nvm use 20`) |
| Charts flicker after schema changes | Clear `db/custom.db` (delete the file, re-run `npx prisma db push`) or press **Clear all** in the dashboard |
| Windows PowerShell blocked scripts | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npx` commands directly |

---

## ☁️ Deploy to Render (free tier, live public URL)

PathPulse needs a Node.js server (Next.js + SQLite/Prisma), so it cannot run on purely static hosts like GitHub Pages. **Render** provides a free tier that supports persistent disks for SQLite.

### 1 — Push to GitHub

```bash
# Inside the project folder
git init                        # if not already a git repo
git add .
git commit -m "feat: initial PathPulse release"

# Create a repo on github.com, then:
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 2 — Deploy on Render

1. Go to [render.com](https://render.com) and sign in (GitHub login is easiest).
2. Click **New → Web Service** and connect your GitHub repo.
3. Render will auto-detect the `render.yaml` blueprint. Accept the defaults:

| Setting | Value |
| --- | --- |
| **Build command** | `npm install && npx prisma generate && npx prisma db push && npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public` |
| **Start command** | `node .next/standalone/server.js` |
| **Node version** | 20 (set via Environment → `NODE_VERSION=20`) |
| **Disk** | Mount at `/opt/render/project/src/db`, 1 GB |

4. Add these **Environment Variables** in the Render dashboard:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/opt/render/project/src/db/custom.db` |
| `NODE_VERSION` | `20` |

5. Click **Deploy**. First build takes ~3 minutes. When it goes green, your public URL (e.g. `https://pathpulse.onrender.com`) is live.

6. **Update this README** — paste your live URL in the badge at the top:
   ```md
   > 🚀 **Live demo:** https://pathpulse.onrender.com
   ```

> **Note:** The Render free plan spins down after 15 minutes of inactivity. The first request after a cold start takes ~30 seconds to wake up. Upgrade to the $7/month Starter plan to keep it always-on.


### 60-second tour

1. You land on the **Lumina Voyages demo site** — a glassmorphism aurora-travel storefront that is fully tracked. Click things, scroll, fill the contact form.
2. Notice the **REC badge** and live stats (engaged time, clicks, depth) in the top bar, plus amber dots marking your clicks.
3. Switch to **Dashboard** → the **Live** tab shows your own session in real time.
4. Press **Load sample data** to add 12 simulated visitors, then explore:
   - **Overview** for aggregate charts,
   - **Heatmaps** for click density and scroll reach,
   - **Sessions** → **Replay** to watch a recorded visit,
   - the **Watch** buttons on the Live tab to jump straight into a replay.
5. Toggle **dark mode** from the top bar any time.

---

## 🗂 Project structure

```
src/
├── app/
│   ├── page.tsx                  # App shell: site/dashboard views + tracker wiring
│   ├── layout.tsx                # Theme provider, metadata, toaster
│   ├── globals.css               # Teal design tokens, scrollbars, glass/starfield/aurora utilities
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
    ├── demo/DemoSite.tsx         # Lumina Voyages glass storefront (live + static modes)
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
