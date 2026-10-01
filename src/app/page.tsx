"use client";

// PathPulse — Website Behaviour Tracker app shell.
// Two views share one route: the tracked demo storefront and the
// analytics dashboard. The tracker runs on the demo site view only.

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Activity,
  BarChart3,
  Crosshair,
  Globe,
  Moon,
  PauseCircle,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoSite } from "@/components/demo/DemoSite";
import {
  Dashboard,
  DashboardTab,
} from "@/components/dashboard/Dashboard";
import {
  PathPulseTracker,
  LiveStats,
} from "@/lib/tracker/tracker";
import { fmtDuration } from "@/lib/tracker/format";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function Home() {
  const [view, setView] = React.useState<"site" | "dashboard">("site");
  const [tab, setTab] = React.useState<DashboardTab>("live");
  const [replayId, setReplayId] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<LiveStats | null>(null);
  const [overlay, setOverlay] = React.useState(true);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1_500, refetchOnWindowFocus: false } },
      })
  );

  const trackerRef = React.useRef<PathPulseTracker | null>(null);
  const siteRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = siteRef.current;
    if (!el) return;
    const tracker = new PathPulseTracker();
    trackerRef.current = tracker;
    tracker.attach(el);
    tracker.onStats(setStats);
    window.PathPulse = {
      tracker,
      flush: () => void tracker.flush(),
      stats: () => tracker.stats(),
    };
    return () => {
      tracker.destroy();
      trackerRef.current = null;
      window.PathPulse = undefined;
    };
  }, []);

  React.useEffect(() => {
    trackerRef.current?.setActive(view === "site");
  }, [view]);

  React.useEffect(() => {
    trackerRef.current?.setOverlayEnabled(overlay);
  }, [overlay]);

  const watch = (id: string) => {
    setReplayId(id);
    setView("dashboard");
    setTab("replay");
  };

  const recording = view === "site" && stats?.active !== false;
  const hud = stats;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4 md:px-8">
            {/* brand */}
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-sm">
                <Activity className="h-4.5 w-4.5" />
              </span>
              <div className="leading-tight hidden sm:block">
                <p className="text-sm font-extrabold tracking-tight">
                  PathPulse
                </p>
                <p className="text-[11px] text-muted-foreground">
                  behaviour tracker
                </p>
              </div>
            </div>

            {/* view switch */}
            <div className="ml-2 flex rounded-lg border bg-muted/50 p-0.5">
              {(
                [
                  ["site", "Demo site", Globe],
                  ["dashboard", "Dashboard", BarChart3],
                ] as Array<["site" | "dashboard", string, React.ElementType]>
              ).map(([v, label, Icon]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition",
                    view === v
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* live HUD */}
            {hud && (
              <div className="ml-auto hidden items-center gap-3 text-xs md:flex">
                {recording ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-semibold text-red-600 dark:text-red-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    REC
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                    <PauseCircle className="h-3.5 w-3.5" />
                    paused
                  </span>
                )}
                <span className="tabular-nums text-muted-foreground">
                  <b className="text-foreground">{fmtDuration(hud.engagedMs)}</b>{" "}
                  engaged
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="text-foreground">{hud.clickCount}</b> clicks
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="text-foreground">{hud.maxScrollDepth}%</b> depth
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="text-foreground">
                    {hud.eventCount}
                  </b>{" "}
                  events
                </span>
              </div>
            )}

            <div className={cn("flex items-center gap-1", !hud && "ml-auto")}>
              {view === "site" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOverlay((o) => !o)}
                  className={cn(
                    "h-9 gap-1.5 px-2.5 text-xs",
                    overlay ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}
                  aria-pressed={overlay}
                >
                  <Crosshair className="h-4 w-4" />
                  <span className="hidden lg:inline">Click dots</span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* views */}
        <main className="flex-1">
          <div
            ref={siteRef}
            className={cn("relative", view === "site" ? "block" : "hidden")}
          >
            <DemoSite mode="live" />
          </div>
          <div
            className={cn(
              view === "dashboard" ? "block" : "hidden"
            )}
          >
            <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-6 md:px-8">
              <Dashboard
                tab={tab}
                onTabChange={setTab}
                replayId={replayId}
                onWatch={watch}
              />
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
