import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EventDTO, SessionDTO, EventType, DeviceType } from "@/lib/tracker/types";

export const dynamic = "force-dynamic";

const LIVE_WINDOW_MS = 45_000;
const MAX_CLICK_POINTS = 20_000;

function parseSession(s: {
  id: string;
  visitorId: string;
  startedAt: Date;
  lastSeenAt: Date;
  endedAt: Date | null;
  durationMs: number;
  engagedMs: number;
  idleMs: number;
  clickCount: number;
  rageClicks: number;
  deadClicks: number;
  moveCount: number;
  scrollCount: number;
  keyCount: number;
  formSubmits: number;
  maxScrollDepth: number;
  mouseDistance: number;
  viewportW: number;
  viewportH: number;
  deviceType: string;
  language: string;
  platform: string;
  referrer: string;
  returning: boolean;
  sectionTimes: string;
  isSeed: boolean;
}): SessionDTO {
  let sectionTimes: Record<string, number> = {};
  try {
    sectionTimes = JSON.parse(s.sectionTimes) as Record<string, number>;
  } catch {
    /* ignore */
  }
  const lastSeenMs = Date.now() - s.lastSeenAt.getTime();
  return {
    ...s,
    deviceType: s.deviceType as DeviceType,
    startedAt: s.startedAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
    sectionTimes,
    live: !s.endedAt && lastSeenMs < LIVE_WINDOW_MS,
  };
}

function parseEvent(e: {
  id: string;
  sessionId: string;
  t: number;
  type: string;
  x: number | null;
  y: number | null;
  vx: number | null;
  vy: number | null;
  sy: number | null;
  sw: number | null;
  sh: number | null;
  targetTag: string | null;
  targetId: string | null;
  targetText: string | null;
  targetClasses: string | null;
  dead: boolean;
  rage: boolean;
  data: string | null;
}): EventDTO {
  let data: Record<string, unknown> = {};
  try {
    data = e.data ? (JSON.parse(e.data) as Record<string, unknown>) : {};
  } catch {
    /* ignore */
  }
  return { ...e, type: e.type as EventType, data };
}

export async function GET() {
  try {
    const now = Date.now();
    const [sessions, clicks, recentEvents, rageEvents, navEvents] =
      await Promise.all([
        db.trackedSession.findMany({
          orderBy: { startedAt: "desc" },
          take: 400,
        }),
        db.trackedEvent.findMany({
          where: { type: "click", x: { not: null } },
          orderBy: { createdAt: "desc" },
          take: MAX_CLICK_POINTS,
          select: {
            x: true,
            y: true,
            sw: true,
            sh: true,
            rage: true,
            dead: true,
            sessionId: true,
            createdAt: true,
          },
        }),
        db.trackedEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 60,
          include: {
            session: { select: { visitorId: true, deviceType: true } },
          },
        }),
        db.trackedEvent.findMany({
          where: { type: "rage_click" },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            session: { select: { visitorId: true, startedAt: true } },
          },
        }),
        db.trackedEvent.findMany({
          where: { type: "nav_click" },
          orderBy: { createdAt: "desc" },
          take: 800,
          select: { data: true },
        }),
      ]);

    const sessionDtos = sessions.map(parseSession);
    const total = sessions.length;
    const active = sessionDtos.filter((s) => s.live);

    const sum = (fn: (s: SessionDTO) => number) =>
      sessionDtos.reduce((acc, s) => acc + fn(s), 0);
    const avg = (fn: (s: SessionDTO) => number) =>
      total ? sum(fn) / total : 0;

    // --- click heatmap points grouped by layout width ---
    const pointsByWidth: Record<
      string,
      Array<{ x: number; y: number; w: number }>
    > = {};
    for (const c of clicks) {
      if (c.x == null || c.y == null) continue;
      const key = c.sw != null ? String(c.sw) : "unknown";
      (pointsByWidth[key] ??= []).push({
        x: c.x,
        y: c.y,
        w: c.rage ? 2.2 : 1,
      });
    }

    // --- top clicked elements ---
    const targetTally = new Map<
      string,
      { label: string; clicks: number; rage: number; dead: number }
    >();
    const clickEvents = await db.trackedEvent.findMany({
      where: { type: "click" },
      orderBy: { createdAt: "desc" },
      take: 6_000,
      select: {
        targetTag: true,
        targetId: true,
        targetText: true,
        rage: true,
        dead: true,
      },
    });
    for (const c of clickEvents) {
      const label =
        c.targetId ||
        [c.targetTag, c.targetText].filter(Boolean).join(" ") ||
        "(unknown)";
      const entry = targetTally.get(label) ?? {
        label,
        clicks: 0,
        rage: 0,
        dead: 0,
      };
      entry.clicks++;
      if (c.rage) entry.rage++;
      if (c.dead) entry.dead++;
      targetTally.set(label, entry);
    }
    const topTargets = [...targetTally.values()]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // --- scroll depth histogram ---
    const bins = [0, 0, 0, 0, 0];
    for (const s of sessionDtos) {
      const d = Math.max(0, Math.min(100, s.maxScrollDepth));
      bins[Math.min(4, Math.floor(d / 20))] += 1;
    }
    const scrollHistogram = ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"].map(
      (range, i) => ({ range, sessions: bins[i] })
    );

    // --- devices ---
    const deviceTally = new Map<string, number>();
    for (const s of sessionDtos) deviceTally.set(s.deviceType, (deviceTally.get(s.deviceType) ?? 0) + 1);
    const devices = [...deviceTally.entries()].map(([device, count]) => ({
      device,
      count,
    }));

    // --- section engagement ---
    const sectionAgg = new Map<string, { totalMs: number; sessions: number }>();
    for (const s of sessionDtos) {
      for (const [sec, ms] of Object.entries(s.sectionTimes)) {
        const e = sectionAgg.get(sec) ?? { totalMs: 0, sessions: 0 };
        e.totalMs += Math.max(0, ms);
        e.sessions += 1;
        sectionAgg.set(sec, e);
      }
    }
    const sections = [...sectionAgg.entries()]
      .map(([section, v]) => ({
        section,
        avgMs: v.sessions ? Math.round(v.totalMs / v.sessions) : 0,
        sessions: v.sessions,
      }))
      .sort((a, b) => b.avgMs - a.avgMs);

    // --- events timeline (last 10 minutes, 20s buckets) ---
    const bucketMs = 20_000;
    const windowStart = now - 10 * 60_000;
    const timelineEvents = await db.trackedEvent.findMany({
      where: { createdAt: { gte: new Date(windowStart) } },
      select: { createdAt: true },
      take: 20_000,
    });
    const bucketCount = Math.floor((10 * 60_000) / bucketMs);
    const buckets = new Array(bucketCount).fill(0);
    for (const e of timelineEvents) {
      const idx = Math.floor((e.createdAt.getTime() - windowStart) / bucketMs);
      if (idx >= 0 && idx < bucketCount) buckets[idx] += 1;
    }
    const eventsTimeline = buckets.map((count, i) => ({
      time: new Date(windowStart + i * bucketMs).toISOString(),
      count,
    }));

    // --- nav funnel ---
    const navTally = new Map<string, number>();
    for (const e of navEvents) {
      try {
        const d = JSON.parse(e.data ?? "{}") as { to?: string };
        if (d.to) navTally.set(d.to, (navTally.get(d.to) ?? 0) + 1);
      } catch {
        /* ignore */
      }
    }
    const navFunnel = [...navTally.entries()].map(([to, count]) => ({
      to,
      count,
    }));

    // --- live active session details ---
    const activeDetails = active.slice(0, 8).map((s) => {
      const lastSectionEvent = recentEvents.find(
        (e) => e.sessionId === s.id && e.type === "section_view"
      );
      return {
        id: s.id,
        visitorId: s.visitorId,
        deviceType: s.deviceType,
        startedAt: s.startedAt,
        engagedMs: s.engagedMs,
        clickCount: s.clickCount,
        maxScrollDepth: s.maxScrollDepth,
        isSeed: s.isSeed,
        currentSection: lastSectionEvent
          ? ((JSON.parse(lastSectionEvent.data ?? "{}") as Record<string, unknown>).section as string | undefined)
          : undefined,
      };
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        totals: {
          sessions: total,
          activeNow: active.length,
          returning: sessionDtos.filter((s) => s.returning).length,
          clicks: sum((s) => s.clickCount),
          rageClicks: sum((s) => s.rageClicks),
          deadClicks: sum((s) => s.deadClicks),
          formSubmits: sum((s) => s.formSubmits),
          keyPresses: sum((s) => s.keyCount),
          scrollEvents: sum((s) => s.scrollCount),
          mouseDistance: sum((s) => s.mouseDistance),
          avgEngagedMs: Math.round(avg((s) => s.engagedMs)),
          avgDurationMs: Math.round(avg((s) => s.durationMs)),
          avgScrollDepth: Math.round(avg((s) => s.maxScrollDepth)),
          avgClicks: Math.round(avg((s) => s.clickCount) * 10) / 10,
        },
        activeSessions: activeDetails,
        recentEvents: recentEvents.map((e) => ({
          ...parseEvent(e),
          createdAt: e.createdAt.toISOString(),
          visitorId: e.session.visitorId,
          deviceType: e.session.deviceType,
        })),
        rageEvents: rageEvents.map((e) => ({
          ...parseEvent(e),
          visitorId: e.session.visitorId,
          startedAt: e.session.startedAt.toISOString(),
        })),
        topTargets,
        scrollHistogram,
        devices,
        sections,
        eventsTimeline,
        navFunnel,
        heatmap: {
          pointsByWidth,
          pageHeights: (() => {
            const m = new Map<string, number>();
            for (const c of clicks) {
              if (c.sw == null || c.sh == null) continue;
              m.set(String(c.sw), Math.max(m.get(String(c.sw)) ?? 0, c.sh));
            }
            return Object.fromEntries(m);
          })(),
        },
        sessionDepths: sessionDtos.map((s) => ({
          deviceType: s.deviceType,
          maxScrollDepth: s.maxScrollDepth,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("analytics failed", err);
    return NextResponse.json({ error: "analytics failed" }, { status: 500 });
  }
}
