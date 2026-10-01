import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SessionDTO, DeviceType } from "@/lib/tracker/types";

export const dynamic = "force-dynamic";

const LIVE_WINDOW_MS = 45_000;

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      200,
      Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50
    );
    const sessions = await db.trackedSession.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: { _count: { select: { events: true } } },
    });
    const dtos: SessionDTO[] = sessions.map((s) => {
      let sectionTimes: Record<string, number> = {};
      try {
        sectionTimes = JSON.parse(s.sectionTimes) as Record<string, number>;
      } catch {
        /* ignore */
      }
      return {
        id: s.id,
        visitorId: s.visitorId,
        startedAt: s.startedAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        endedAt: s.endedAt?.toISOString() ?? null,
        durationMs: s.durationMs,
        engagedMs: s.engagedMs,
        idleMs: s.idleMs,
        clickCount: s.clickCount,
        rageClicks: s.rageClicks,
        deadClicks: s.deadClicks,
        moveCount: s.moveCount,
        scrollCount: s.scrollCount,
        keyCount: s.keyCount,
        formSubmits: s.formSubmits,
        maxScrollDepth: s.maxScrollDepth,
        mouseDistance: s.mouseDistance,
        viewportW: s.viewportW,
        viewportH: s.viewportH,
        deviceType: s.deviceType as DeviceType,
        language: s.language,
        platform: s.platform,
        referrer: s.referrer,
        returning: s.returning,
        sectionTimes,
        isSeed: s.isSeed,
        live:
          !s.endedAt &&
          Date.now() - s.lastSeenAt.getTime() < LIVE_WINDOW_MS,
        eventCount: s._count.events,
      };
    });
    return NextResponse.json(
      { sessions: dtos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("sessions list failed", err);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.trackedSession.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("clear sessions failed", err);
    return NextResponse.json({ error: "clear failed" }, { status: 500 });
  }
}
