"use client";

// Sessions tab: browse recorded sessions, filter, replay, delete.

import * as React from "react";
import {
  Monitor,
  Play,
  Search,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SessionDTO } from "@/lib/tracker/types";
import {
  DepthBar,
  DeviceIcon,
  EmptyState,
  LiveBadge,
} from "./shared";
import {
  fmtDuration,
  fmtDateTime,
  shortVisitor,
} from "@/lib/tracker/format";
import { cn } from "@/lib/utils";

export function SessionsTab({
  sessions,
  onWatch,
  onDelete,
  onSeed,
  busy,
}: {
  sessions: SessionDTO[] | undefined;
  onWatch: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onSeed: () => void;
  busy: boolean;
}) {
  const [device, setDevice] = React.useState("all");
  const [liveOnly, setLiveOnly] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let list = sessions ?? [];
    if (device !== "all") list = list.filter((s) => s.deviceType === device);
    if (liveOnly) list = list.filter((s) => s.live);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.visitorId.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sessions, device, liveOnly, query]);

  const deviceCounts = React.useMemo(() => {
    const tally: Record<string, number> = { all: sessions?.length ?? 0 };
    for (const s of sessions ?? []) tally[s.deviceType] = (tally[s.deviceType] ?? 0) + 1;
    return tally;
  }, [sessions]);

  if (sessions && sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions recorded yet"
        description="Sessions appear here as soon as someone browses the demo site. Interact with the site view, or load sample data to see replays of simulated visitors."
        action={
          <Button onClick={onSeed} className="font-semibold" disabled={busy}>
            Load sample data
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          {[
            ["all", "All", null],
            ["desktop", "Desktop", Monitor],
            ["mobile", "Mobile", Smartphone],
            ["tablet", "Tablet", Tablet],
          ].map(([value, label, Icon]) => {
            const v = value as string;
            const I = Icon as React.ElementType | null;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setDevice(v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                  device === v
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {I && <I className="h-3.5 w-3.5" />}
                {label as string}
                <span className="text-xs text-muted-foreground">
                  {deviceCounts[v] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Switch id="live-only" checked={liveOnly} onCheckedChange={setLiveOnly} />
          <Label htmlFor="live-only" className="text-sm text-muted-foreground">
            Live only
          </Label>
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search visitor or session id"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border">
        <div className="max-h-[62vh] overflow-y-auto pp-scroll">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Engaged</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Scroll depth</TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => onWatch(s.id)}
                >
                  <TableCell className="font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      {s.returning && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                aria-label="Returning visitor"
                              />
                            </TooltipTrigger>
                            <TooltipContent>Returning visitor</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {shortVisitor(s.visitorId)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                      <DeviceIcon device={s.deviceType} />
                      {s.deviceType}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDateTime(s.startedAt)}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {fmtDuration(s.durationMs)}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {fmtDuration(s.engagedMs)}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {s.clickCount}
                  </TableCell>
                  <TableCell>
                    <DepthBar depth={s.maxScrollDepth} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {s.rageClicks > 0 && (
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-bold text-red-500">
                          {s.rageClicks} rage
                        </span>
                      )}
                      {s.deadClicks > 0 && (
                        <span className="rounded bg-stone-500/10 px-1.5 py-0.5 text-[11px] font-bold text-stone-500">
                          {s.deadClicks} dead
                        </span>
                      )}
                      {s.formSubmits > 0 && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">
                          form
                        </span>
                      )}
                      {s.rageClicks === 0 &&
                        s.deadClicks === 0 &&
                        s.formSubmits === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <LiveBadge live={s.live} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onWatch(s.id)}
                        className="h-8 gap-1 px-2.5 text-xs"
                      >
                        <Play className="h-3 w-3" />
                        Replay
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(s.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                        aria-label="Delete session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No sessions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
