"use client";

// Session replay: plays back recorded events over a static render of the
// demo page — animated cursor, scroll position, click pings and a scrubable
// timeline with click markers.

import * as React from "react";
import {
  ChevronLeft,
  Gauge,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DemoSite } from "@/components/demo/DemoSite";
import { cn } from "@/lib/utils";
import { EventDTO, SessionDTO } from "@/lib/tracker/types";
import {
  DeviceIcon,
  EventIcon,
  eventDescription,
  LiveBadge,
} from "./shared";
import {
  fmtClock,
  fmtDuration,
  fmtDateTime,
  shortVisitor,
} from "@/lib/tracker/format";
import { useQuery } from "@tanstack/react-query";
import { SessionDetailResponse } from "./types";

const StaticDemo = React.memo(DemoSite);

interface InterpPoint {
  t: number;
  x: number;
  y: number;
}

function interpolate(points: InterpPoint[], t: number) {
  if (points.length === 0) return null;
  if (t <= points[0].t) return points[0];
  for (let i = 1; i < points.length; i++) {
    if (points[i].t >= t) {
      const a = points[i - 1];
      const b = points[i];
      const span = b.t - a.t || 1;
      const p = Math.max(0, Math.min(1, (t - a.t) / span));
      return {
        t,
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
      };
    }
  }
  return points[points.length - 1];
}

export function ReplayTab({
  sessionId,
  onBack,
}: {
  sessionId: string | null;
  onBack: () => void;
}) {
  const { data, isLoading } = useQuery<SessionDetailResponse>({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("session detail failed");
      return (await res.json()) as SessionDetailResponse;
    },
    enabled: !!sessionId,
    refetchInterval: (q) =>
      q.state.data?.session?.live ? 5000 : false,
  });

  if (!sessionId) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed py-24 text-center">
        <div className="max-w-md px-6">
          <Play className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-base font-semibold">
            Pick a session to replay
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Open the Sessions or Live tab and press Replay / Watch on any
            session to watch a pixel-accurate recording of the visit: cursor
            movement, scrolling and every click.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center rounded-xl border py-24">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Loading session recording...
        </div>
      </div>
    );
  }

  return (
    <ReplayPlayer
      session={data.session}
      events={data.events}
      onBack={onBack}
    />
  );
}

function ReplayPlayer({
  session,
  events,
  onBack,
}: {
  session: SessionDTO;
  events: EventDTO[];
  onBack: () => void;
}) {
  const [curT, setCurT] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(2);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const streamRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);
  const lastTsRef = React.useRef<number>(0);

  const duration = Math.max(1000, session.durationMs);

  // recorded page geometry
  const sw = React.useMemo(() => {
    const widths = events.map((e) => e.sw).filter((v): v is number => v != null);
    if (widths.length === 0) return session.viewportW || 1200;
    widths.sort((a, b) => a - b);
    return widths[Math.floor(widths.length / 2)];
  }, [events, session.viewportW]);
  const sh = React.useMemo(() => {
    const hs = events.map((e) => e.sh).filter((v): v is number => v != null);
    return hs.length ? Math.max(...hs) : 6600;
  }, [events]);
  const viewportH = Math.max(400, Math.min(session.viewportH || 800, sh - 50));

  const moves = React.useMemo(
    () =>
      events
        .filter((e) => e.type === "mousemove" && e.x != null && e.y != null)
        .map((e) => ({ t: e.t, x: e.x as number, y: e.y as number })),
    [events]
  );
  const scrollPoints = React.useMemo(
    () =>
      events
        .filter((e) => e.type === "scroll" && e.sy != null)
        .map((e) => ({ t: e.t, sy: e.sy as number })),
    [events]
  );
  const clicks = React.useMemo(
    () =>
      events.filter(
        (e) => (e.type === "click" || e.type === "rage_click") && e.x != null && e.y != null
      ),
    [events]
  );

  const [displayScale, setDisplayScale] = React.useState(0.5);

  React.useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      setDisplayScale(el.clientWidth / sw);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [sw]);

  // playback loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = 0;
      return;
    }
    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setCurT((prev) => {
        const next = prev + dt * speed;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, duration]);

  // derived playback state
  const cursor = interpolate(moves, curT);
  const scrollState = interpolate(
    scrollPoints.map((p) => ({ t: p.t, x: p.sy, y: 0 })),
    curT
  );
  const sy = Math.max(0, Math.min(sh - viewportH, scrollState?.x ?? 0));
  const activeClicks = React.useMemo(
    () =>
      clicks.filter(
        (c) =>
          c.t <= curT && curT - c.t < 1400 && c.x != null && c.y != null
      ),
    [clicks, curT]
  );
  const activeEvents = React.useMemo(
    () => events.filter((e) => e.t <= curT),
    [events, curT]
  );
  const currentSection = React.useMemo(() => {
    const sectionEvents = events.filter(
      (e) => e.type === "section_view" && e.t <= curT
    );
    const last = sectionEvents[sectionEvents.length - 1];
    if (!last) return null;
    const d = last.data as { section?: string; visible?: boolean };
    return d?.visible ? (d.section ?? null) : null;
  }, [events, curT]);

  // auto-scroll event stream
  React.useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeEvents.length]);

  // keyboard shortcuts on the player
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clickMarkers = activeClicks;
  const replayH = viewportH * displayScale;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-9 gap-1.5 px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <DeviceIcon device={session.deviceType} className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-mono text-sm font-semibold leading-none">
              {shortVisitor(session.visitorId)}
              <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                {fmtDateTime(session.startedAt)}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <LiveBadge live={session.live} />
              {session.deviceType} · {session.viewportW}×{session.viewportH}
              {session.isSeed && " · sample"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
          {[
            [`${session.clickCount}`, "clicks", MousePointerClick],
            [`${session.rageClicks}`, "rage", Zap],
            [fmtDuration(session.engagedMs), "engaged", Gauge],
            [`${session.maxScrollDepth}%`, "depth", Gauge],
          ].map(([value, label, Icon], i) => {
            const I = Icon as React.ElementType;
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1.5 tabular-nums"
              >
                <I className="h-3.5 w-3.5 text-muted-foreground" />
                <b>{value as string}</b>
                <span className="text-muted-foreground">{label as string}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* player */}
        <Card className="overflow-hidden xl:col-span-2">
          <CardContent className="p-0">
            <div
              ref={viewportRef}
              className="relative w-full select-none overflow-hidden bg-[#faf6f0]"
              style={{ height: Math.max(380, replayH) }}
              aria-label="Session replay viewport"
            >
              <div
                style={{
                  width: sw,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transformOrigin: "0 0",
                  transform: `scale(${displayScale})`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: sw,
                    height: sh,
                    transform: `translateY(${-sy}px)`,
                  }}
                >
                  <StaticDemo mode="static" />
                  {/* click pings */}
                  {clickMarkers.map((c) => (
                    <span
                      key={c.id}
                      className={cn(
                        "pointer-events-none absolute z-20 grid place-items-center rounded-full",
                        c.type === "rage_click" || c.rage
                          ? "h-7 w-7 bg-red-500/70 ring-4 ring-red-400/40"
                          : "h-5 w-5 bg-amber-500/80 ring-4 ring-amber-400/30"
                      )}
                      style={{
                        left: (c.x as number) - (c.type === "rage_click" ? 14 : 10),
                        top: (c.y as number) - (c.type === "rage_click" ? 14 : 10),
                        animation: "pp-pop .3s ease",
                      }}
                    />
                  ))}
                  {/* cursor */}
                  {cursor && (
                    <span
                      className="pointer-events-none absolute z-30"
                      style={{
                        left: cursor.x,
                        top: cursor.y,
                        transition: "left 60ms linear, top 60ms linear",
                      }}
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        style={{
                          filter: "drop-shadow(0 1px 3px rgba(0,0,0,.45))",
                        }}
                        aria-hidden
                      >
                        <path
                          d="M5 3l14 7.5-6.2 1.2L10 18.7z"
                          fill="#111"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* HUD */}
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                <span className="tabular-nums">{fmtClock(curT)}</span>
                <span className="opacity-60">/ {fmtClock(duration)}</span>
                {currentSection && (
                  <span className="ml-1 rounded bg-white/20 px-2 py-0.5 capitalize">
                    {currentSection}
                  </span>
                )}
                {playing && (
                  <span className="ml-1 flex items-center gap-1 rounded bg-red-500/80 px-2 py-0.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    {speed}×
                  </span>
                )}
              </div>
            </div>

            {/* controls */}
            <div className="space-y-3 border-t bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (curT >= duration) setCurT(0);
                    setPlaying((p) => !p);
                  }}
                  className="h-10 w-10 shrink-0 rounded-full p-0"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-0.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCurT(0);
                    setPlaying(false);
                  }}
                  className="h-9 w-9 shrink-0"
                  aria-label="Restart"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* timeline with click markers */}
                <div className="relative flex-1">
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={50}
                    value={Math.round(curT)}
                    onChange={(e) => {
                      setCurT(Number(e.target.value));
                      setPlaying(false);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-teal-600 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600"
                    aria-label="Timeline position"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-2">
                    {clicks.map((c) => (
                      <span
                        key={c.id}
                        className={cn(
                          "absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
                          c.type === "rage_click" || c.rage
                            ? "bg-red-500"
                            : "bg-amber-500"
                        )}
                        style={{
                          left: `calc(${(c.t / duration) * 100}% - 4px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-background p-1">
                  {[1, 2, 4, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold transition",
                        speed === s
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {events.length.toLocaleString()} events recorded ·{" "}
                {moves.length.toLocaleString()} cursor points · Space to
                play/pause · drag the timeline to scrub · dots on the timeline
                are clicks
              </p>
            </div>
          </CardContent>
        </Card>

        {/* event stream */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Event timeline
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {activeEvents.length} / {events.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="pp-scroll h-[540px]">
              <div ref={streamRef} className="space-y-1 px-4 pb-4">
                {events.map((e) => {
                  const isPast = e.t <= curT;
                  const isRecent =
                    isPast && curT - e.t < 2500;
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                        isRecent
                          ? "border-primary/40 bg-primary/10 opacity-100"
                          : isPast
                          ? "border-transparent bg-muted/40 opacity-60"
                          : "border-transparent opacity-30"
                      )}
                    >
                      <EventIcon
                        type={e.type}
                        dead={e.dead}
                        rage={e.rage}
                        className="shrink-0"
                      />
                      <span className="tabular-nums text-muted-foreground">
                        {fmtClock(e.t)}
                      </span>
                      <span className="truncate">
                        {eventDescription(e, true)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
