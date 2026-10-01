import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_EVENTS_PER_SESSION = 20_000;

interface IncomingEvent {
  t?: number;
  type?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  sy?: number;
  sw?: number;
  sh?: number;
  targetTag?: string;
  targetId?: string;
  targetText?: string;
  targetClasses?: string;
  dead?: boolean;
  rage?: boolean;
  data?: Record<string, unknown>;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function str(v: unknown, max = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const sessionId = str(body.sessionId, 64);
    const visitorId = str(body.visitorId, 64);
    if (!sessionId || !visitorId) {
      return NextResponse.json(
        { error: "sessionId and visitorId are required" },
        { status: 400 }
      );
    }
    const device = (body.device ?? {}) as Record<string, unknown>;
    const summary = (body.summary ?? {}) as Record<string, unknown>;
    const events = Array.isArray(body.events)
      ? (body.events as IncomingEvent[])
      : [];
    const ended = body.ended === true;
    const startedAtRaw = str(body.startedAt);
    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date();

    const data = {
      visitorId,
      durationMs: Math.round(num(summary.durationMs) ?? 0),
      engagedMs: Math.round(num(summary.engagedMs) ?? 0),
      idleMs: Math.round(num(summary.idleMs) ?? 0),
      clickCount: Math.round(num(summary.clickCount) ?? 0),
      rageClicks: Math.round(num(summary.rageClicks) ?? 0),
      deadClicks: Math.round(num(summary.deadClicks) ?? 0),
      moveCount: Math.round(num(summary.moveCount) ?? 0),
      scrollCount: Math.round(num(summary.scrollCount) ?? 0),
      keyCount: Math.round(num(summary.keyCount) ?? 0),
      formSubmits: Math.round(num(summary.formSubmits) ?? 0),
      maxScrollDepth: Math.round(num(summary.maxScrollDepth) ?? 0),
      mouseDistance: Math.round(num(summary.mouseDistance) ?? 0),
      pageHeight: Math.round(num(summary.pageHeight) ?? 0),
      sectionTimes: JSON.stringify(summary.sectionTimes ?? {}),
    };

    const existing = await db.trackedSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!existing) {
      await db.trackedSession.create({
        data: {
          id: sessionId,
          visitorId,
          startedAt,
          endedAt: ended ? new Date() : null,
          lastSeenAt: new Date(),
          viewportW: Math.round(num(device.viewportW) ?? 0),
          viewportH: Math.round(num(device.viewportH) ?? 0),
          screenWidth: Math.round(num(device.screenWidth) ?? 0),
          screenHeight: Math.round(num(device.screenHeight) ?? 0),
          deviceType: str(device.deviceType, 16) ?? "desktop",
          language: str(device.language, 16) ?? "",
          platform: str(device.platform, 64) ?? "",
          referrer: str(device.referrer, 300) ?? "",
          userAgent: str(device.userAgent, 300) ?? "",
          returning: body.returning === true,
          ...data,
        },
      });
    } else {
      await db.trackedSession.update({
        where: { id: sessionId },
        data: {
          ...data,
          lastSeenAt: new Date(),
          ...(ended ? { endedAt: new Date() } : {}),
        },
      });
    }

    if (events.length > 0) {
      const count = await db.trackedEvent.count({ where: { sessionId } });
      if (count < MAX_EVENTS_PER_SESSION) {
        const rows = events
          .slice(0, MAX_EVENTS_PER_SESSION - count)
          .map((e) => ({
            sessionId,
            t: Math.max(0, Math.round(num(e.t) ?? 0)),
            type: str(e.type, 32) ?? "unknown",
            x: num(e.x),
            y: num(e.y),
            vx: num(e.vx),
            vy: num(e.vy),
            sy: num(e.sy),
            sw: num(e.sw),
            sh: num(e.sh),
            targetTag: str(e.targetTag, 40),
            targetId: str(e.targetId, 80),
            targetText: str(e.targetText, 80),
            targetClasses: str(e.targetClasses, 120),
            dead: e.dead === true,
            rage: e.rage === true,
            data: e.data ? JSON.stringify(e.data) : undefined,
          }));
        try {
          await db.trackedEvent.createMany({ data: rows });
        } catch {
          // Fallback for datasources without createMany support.
          for (const row of rows) {
            await db.trackedEvent.create({ data: row });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, stored: events.length });
  } catch (err) {
    console.error("track ingest failed", err);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}
