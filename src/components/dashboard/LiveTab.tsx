"use client";

// Live tab: active sessions, real-time event stream, rage-click alerts.

import * as React from "react";
import {
  Activity,
  MousePointerClick,
  Radio,
  Users,
  Zap,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DeviceIcon,
  EmptyState,
  EventIcon,
  eventDescription,
} from "./shared";
import { AnalyticsResponse } from "./types";
import {
  fmtDuration,
  fmtClockTime,
  shortVisitor,
  timeAgo,
} from "@/lib/tracker/format";

export function LiveTab({
  data,
  onWatch,
  onSeed,
}: {
  data: AnalyticsResponse | undefined;
  onWatch: (sessionId: string) => void;
  onSeed: () => void;
}) {
  const totals = data?.totals;
  const events = data?.recentEvents ?? [];
  const active = data?.activeSessions ?? [];
  const recentRage = (data?.rageEvents ?? []).slice(0, 5);

  if (data && totals && totals.sessions === 0 && active.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Open the demo site from the top bar and interact with it, or load sample data to explore the dashboard with pre-generated visitor sessions."
        action={
          <Button onClick={onSeed} className="font-semibold">
            Load sample data
          </Button>
        }
      />
    );
  }

  const eventsPerMin = (() => {
    const tl = data?.eventsTimeline ?? [];
    const last3 = tl.slice(-3);
    const sum = last3.reduce((a, b) => a + b.count, 0);
    return sum * 1; // 3 buckets x 20s => per minute
  })();

  return (
    <div className="space-y-4">
      {/* pulse chips */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Active right now",
            value: `${totals?.activeNow ?? 0}`,
            icon: Radio,
            live: true,
          },
          {
            label: "Events / minute",
            value: `${eventsPerMin}`,
            icon: Activity,
          },
          {
            label: "Total clicks",
            value: `${totals?.clicks ?? 0}`,
            icon: MousePointerClick,
          },
          {
            label: "Rage clicks",
            value: `${totals?.rageClicks ?? 0}`,
            icon: Zap,
            danger: (totals?.rageClicks ?? 0) > 0,
          },
        ].map((chip) => (
          <Card key={chip.label} className="py-3">
            <CardContent className="flex items-center gap-3 px-4">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg",
                  chip.live
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : chip.danger
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                )}
              >
                <chip.icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold tabular-nums leading-none">
                  {chip.value}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {chip.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* event stream */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-emerald-500" />
              Live event stream
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                refreshes every 3s
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="pp-scroll h-[430px] px-4 pb-4">
              <div className="space-y-1.5">
                {events.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Waiting for events...
                  </p>
                )}
                {events.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                      e.type === "rage_click"
                        ? "border-red-500/30 bg-red-500/5"
                        : e.type === "click" && e.dead
                        ? "border-stone-400/30 bg-stone-500/5"
                        : "bg-muted/40"
                    )}
                  >
                    <span className="shrink-0">
                      <EventIcon
                        type={e.type}
                        dead={e.dead}
                        rage={e.rage}
                        className={cn(
                          e.type === "rage_click"
                            ? "text-red-500"
                            : "text-muted-foreground"
                        )}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {eventDescription(e)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtClockTime(e.createdAt)}
                      </p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      <DeviceIcon device={e.deviceType} />
                      {shortVisitor(e.visitorId)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {/* active sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Active sessions
                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {active.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {active.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No one is browsing right now.
                </p>
              )}
              {active.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <DeviceIcon device={s.deviceType} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-mono text-xs font-semibold">
                        {shortVisitor(s.visitorId)}
                      </p>
                      {s.isSeed && (
                        <span className="rounded bg-stone-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
                          seed
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmtDuration(s.engagedMs)} engaged · {s.clickCount} clicks
                      · {s.maxScrollDepth}% depth
                      {s.currentSection ? ` · in ${s.currentSection}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onWatch(s.id)}
                    className="h-8 gap-1 px-2.5 text-xs"
                  >
                    <Play className="h-3 w-3" />
                    Watch
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* rage alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-red-500" />
                Rage-click alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recentRage.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No rage clicks detected. Frustration level: zero.
                </p>
              )}
              {recentRage.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-sm"
                >
                  <p className="font-medium">
                    {eventDescription(r, true)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Visitor {shortVisitor(r.visitorId)} ·{" "}
                    {timeAgo(r.startedAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
