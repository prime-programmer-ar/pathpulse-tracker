"use client";

// Dashboard shell: tab navigation, data queries, seed/clear controls.

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Database,
  Flame,
  History,
  Radio,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LiveTab } from "./LiveTab";
import { OverviewTab } from "./OverviewTab";
import { HeatmapTab } from "./HeatmapTab";
import { SessionsTab } from "./SessionsTab";
import { ReplayTab } from "./ReplayTab";
import { AnalyticsResponse, SessionsResponse } from "./types";
import { toast } from "@/hooks/use-toast";

export type DashboardTab =
  | "live"
  | "overview"
  | "heatmap"
  | "sessions"
  | "replay";

export function Dashboard({
  tab,
  onTabChange,
  replayId,
  onWatch,
}: {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  replayId: string | null;
  onWatch: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState<string | null>(null);

  const analytics = useQuery<AnalyticsResponse>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      if (!res.ok) throw new Error("analytics failed");
      return (await res.json()) as AnalyticsResponse;
    },
    refetchInterval: 3000,
  });

  const sessions = useQuery<SessionsResponse>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions?limit=100", { cache: "no-store" });
      if (!res.ok) throw new Error("sessions failed");
      return (await res.json()) as SessionsResponse;
    },
    refetchInterval: 8000,
  });

  const seed = async () => {
    setBusy("seed");
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 12 }),
      });
      if (!res.ok) throw new Error("seed failed");
      toast({
        title: "Sample data loaded",
        description:
          "12 simulated visitor sessions were added — explore the heatmap, overview and replays.",
      });
      queryClient.invalidateQueries();
    } catch {
      toast({
        title: "Could not load sample data",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const clearAll = async () => {
    if (
      !window.confirm(
        "Delete ALL recorded sessions? This removes every real and sample session."
      )
    )
      return;
    setBusy("clear");
    try {
      await fetch("/api/sessions", { method: "DELETE" });
      toast({
        title: "All data cleared",
        description: "The tracker will record new sessions as you browse.",
      });
      queryClient.invalidateQueries();
    } catch {
      toast({
        title: "Could not clear data",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries();
    } catch {
      toast({ title: "Could not delete session", variant: "destructive" });
    }
  };

  const hasData = (analytics.data?.totals.sessions ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </span>
            Behaviour dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every interaction on the demo site is streamed here in real time.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {analytics.isFetching && (
            <span className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              syncing
            </span>
          )}
          {!hasData && (
            <Button
              onClick={seed}
              disabled={busy === "seed"}
              className="gap-1.5 font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              {busy === "seed" ? "Loading..." : "Load sample data"}
            </Button>
          )}
          {hasData && (
            <>
              <Button
                variant="outline"
                onClick={seed}
                disabled={busy === "seed"}
                className="gap-1.5"
              >
                <Database className="h-4 w-4" />
                Add samples
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={busy === "clear"}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as DashboardTab)}
      >
        <TabsList className="h-auto flex-wrap bg-muted/60 p-1">
          {(
            [
              ["live", "Live", Radio],
              ["overview", "Overview", Activity],
              ["heatmap", "Heatmaps", Flame],
              ["sessions", "Sessions", History],
              ["replay", "Replay", Sparkles],
            ] as Array<[DashboardTab, string, React.ElementType]>
          ).map(([value, label, Icon]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 px-3.5 py-2 data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
              {value === "live" &&
                (analytics.data?.totals.activeNow ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {analytics.data?.totals.activeNow}
                  </span>
                )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <LiveTab
            data={analytics.data}
            onWatch={(id) => {
              onWatch(id);
              onTabChange("replay");
            }}
            onSeed={seed}
          />
        </TabsContent>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab data={analytics.data} onSeed={seed} />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <HeatmapTab data={analytics.data} onSeed={seed} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <SessionsTab
            sessions={sessions.data?.sessions}
            onWatch={(id) => {
              onWatch(id);
              onTabChange("replay");
            }}
            onDelete={deleteSession}
            onSeed={seed}
            busy={busy === "seed"}
          />
        </TabsContent>
        <TabsContent value="replay" className="mt-4">
          <ReplayTab
            sessionId={replayId}
            onBack={() => onTabChange("sessions")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
