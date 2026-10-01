import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EventDTO, SessionDTO, DeviceType, EventType } from "@/lib/tracker/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await db.trackedSession.findUnique({
      where: { id },
      include: { events: { orderBy: [{ t: "asc" }, { createdAt: "asc" }] } },
    });
    if (!session) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    let sectionTimes: Record<string, number> = {};
    try {
      sectionTimes = JSON.parse(session.sectionTimes) as Record<string, number>;
    } catch {
      /* ignore */
    }
    const dto: SessionDTO = {
      id: session.id,
      visitorId: session.visitorId,
      startedAt: session.startedAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      durationMs: session.durationMs,
      engagedMs: session.engagedMs,
      idleMs: session.idleMs,
      clickCount: session.clickCount,
      rageClicks: session.rageClicks,
      deadClicks: session.deadClicks,
      moveCount: session.moveCount,
      scrollCount: session.scrollCount,
      keyCount: session.keyCount,
      formSubmits: session.formSubmits,
      maxScrollDepth: session.maxScrollDepth,
      mouseDistance: session.mouseDistance,
      viewportW: session.viewportW,
      viewportH: session.viewportH,
      deviceType: session.deviceType as DeviceType,
      language: session.language,
      platform: session.platform,
      referrer: session.referrer,
      returning: session.returning,
      sectionTimes,
      isSeed: session.isSeed,
      live:
        !session.endedAt &&
        Date.now() - session.lastSeenAt.getTime() < 45_000,
    };
    const events: EventDTO[] = session.events.map((e) => {
      let data: Record<string, unknown> = {};
      try {
        data = e.data ? (JSON.parse(e.data) as Record<string, unknown>) : {};
      } catch {
        /* ignore */
      }
      return {
        id: e.id,
        sessionId: e.sessionId,
        t: e.t,
        type: e.type as EventType,
        x: e.x,
        y: e.y,
        vx: e.vx,
        vy: e.vy,
        sy: e.sy,
        sw: e.sw,
        sh: e.sh,
        targetTag: e.targetTag,
        targetId: e.targetId,
        targetText: e.targetText,
        targetClasses: e.targetClasses,
        dead: e.dead,
        rage: e.rage,
        data,
      };
    });
    return NextResponse.json(
      { session: dto, events },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("session detail failed", err);
    return NextResponse.json({ error: "detail failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.trackedSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
