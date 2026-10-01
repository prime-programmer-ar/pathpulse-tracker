"use client";

// Heatmap tab: renders the demo page in static mode and overlays
// canvas-based visualisations of aggregate click + scroll behaviour.

import * as React from "react";
import { Flame, Info, Map as MapIcon, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { DemoSite } from "@/components/demo/DemoSite";
import { drawHeatmap, reachColor } from "@/lib/tracker/heatmap";
import { AnalyticsResponse } from "./types";
import { EmptyState } from "./shared";

type Mode = "heatmap" | "dots" | "scroll";

const StaticDemo = React.memo(DemoSite);

interface SectionBand {
  id: string;
  top: number;
  bottom: number;
}

function classifyWidth(sw: number): "mobile" | "tablet" | "desktop" {
  if (sw < 500) return "mobile";
  if (sw < 900) return "tablet";
  return "desktop";
}

export function HeatmapTab({
  data,
  onSeed,
}: {
  data: AnalyticsResponse | undefined;
  onSeed: () => void;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = React.useState<Mode>("heatmap");
  const [opacity, setOpacity] = React.useState(85);
  const [device, setDevice] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<{
    scale: number;
    pageH: number;
    sections: SectionBand[];
  } | null>(null);

  // available device classes from data
  const classes = React.useMemo(() => {
    const tally = new Map<string, { count: number; widths: number[] }>();
    for (const [swKey, pts] of Object.entries(
      data?.heatmap.pointsByWidth ?? {}
    )) {
      const sw = Number(swKey);
      if (!Number.isFinite(sw)) continue;
      const cls = classifyWidth(sw);
      const entry = tally.get(cls) ?? { count: 0, widths: [] };
      entry.count += pts.length;
      entry.widths.push(sw);
      tally.set(cls, entry);
    }
    return [...tally.entries()].map(([cls, v]) => ({
      cls,
      count: v.count,
    }));
  }, [data]);

  const activeDevice = React.useMemo(() => {
    if (device) return device;
    if (classes.length > 0) {
      // prefer the class with most clicks
      return [...classes].sort((a, b) => b.count - a.count)[0].cls;
    }
    return "desktop";
  }, [device, classes]);

  // base width = most common sw in that class (fallback per class)
  const baseW = React.useMemo(() => {
    const widths: number[] = [];
    for (const [swKey, pts] of Object.entries(
      data?.heatmap.pointsByWidth ?? {}
    )) {
      const sw = Number(swKey);
      if (!Number.isFinite(sw)) continue;
      if (classifyWidth(sw) === activeDevice) {
        widths.push(...new Array(Math.min(pts.length, 50)).fill(sw));
      }
    }
    if (widths.length === 0) {
      return activeDevice === "mobile" ? 375 : activeDevice === "tablet" ? 834 : 1200;
    }
    widths.sort((a, b) => a - b);
    return widths[Math.floor(widths.length / 2)];
  }, [data, activeDevice]);

  // normalised click points in base-width space
  const points = React.useMemo(() => {
    const pageHeights = data?.heatmap.pageHeights ?? {};
    const classHeights = Object.entries(pageHeights)
      .filter(([k]) => classifyWidth(Number(k)) === activeDevice)
      .map(([, v]) => v);
    const baseH =
      pageHeights[String(baseW)] ??
      (classHeights.length ? Math.max(...classHeights) : 1);
    const out: Array<{ x: number; y: number; rage: boolean; dead: boolean }> = [];
    for (const [swKey, pts] of Object.entries(
      data?.heatmap.pointsByWidth ?? {}
    )) {
      const sw = Number(swKey);
      if (!Number.isFinite(sw)) continue;
      if (classifyWidth(sw) !== activeDevice) continue;
      const sh = pageHeights[swKey] ?? baseH;
      const kx = baseW / sw;
      const ky = baseH / sh;
      for (const p of pts) {
        out.push({
          x: p.x * kx,
          y: p.y * ky,
          rage: p.w > 2,
          dead: false,
        });
      }
    }
    return out;
  }, [data, baseW, activeDevice]);

  const rageCount = React.useMemo(
    () => points.filter((p) => p.rage).length,
    [points]
  );

  const sessionDepthList = React.useMemo(
    () =>
      (data?.sessionDepths ?? []).filter(
        (s) => s.deviceType === activeDevice
      ),
    [data, activeDevice]
  );

  // measure rendered demo page
  React.useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const page = pageRef.current;
      if (!wrap || !page) return;
      const displayW = wrap.clientWidth;
      const pageH = page.scrollHeight || 6000;
      const pageRect = page.getBoundingClientRect();
      const pageScale = pageRect.width / baseW || 1;
      const sections: SectionBand[] = [];
      page
        .querySelectorAll<HTMLElement>("[data-section]")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          const top = (rect.top - pageRect.top) / pageScale;
          const height = rect.height / pageScale;
          sections.push({
            id: el.getAttribute("data-section") ?? "",
            top,
            bottom: top + height,
          });
        });
      setMetrics({
        scale: displayW / baseW,
        pageH,
        sections,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    const t = setTimeout(measure, 300); // after fonts settle
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [baseW]);

  // draw the overlay
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const m = metrics;
    if (!canvas || !m) return;
    const cssW = Math.round(baseW * m.scale);
    const cssH = Math.round(m.pageH * m.scale);
    if (cssW < 2 || cssH < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const scaled = points.map((p) => ({
      x: p.x * m.scale,
      y: p.y * m.scale,
      weight: p.rage ? 2.2 : 1,
    }));

    if (mode === "heatmap" && scaled.length > 0) {
      drawHeatmap(canvas, scaled, {
        radius: 42 * Math.max(0.75, m.scale),
        strength: 0.16,
        opacity: opacity / 100,
        scale: 2,
      });
    } else if (mode === "dots" && points.length > 0) {
      for (const p of points) {
        const x = p.x * m.scale;
        const y = p.y * m.scale;
        if (p.rage) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(239,68,68,0.9)";
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.strokeStyle = "rgba(239,68,68,0.4)";
          ctx.lineWidth = 2;
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.fillStyle = "rgba(13,148,136,0.85)";
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    } else if (mode === "scroll" && sessionDepthList.length > 0) {
      const bands = 28;
      const bandH = cssH / bands;
      for (let i = 0; i < bands; i++) {
        const yFrac = (i + 0.5) / bands;
        const depthNeeded = yFrac * 100;
        const reached = sessionDepthList.filter(
          (s) => s.maxScrollDepth >= depthNeeded - 2
        ).length;
        const frac = reached / sessionDepthList.length;
        ctx.fillStyle = reachColor(frac, 0.34);
        ctx.fillRect(0, i * bandH, cssW, bandH + 1);
      }
      // section separators
      ctx.strokeStyle = "rgba(120,90,60,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (const s of m.sections) {
        const y = s.top * m.scale;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // left rail with reach fraction markers
      const railW = 10;
      for (let i = 0; i < bands; i++) {
        const yFrac = (i + 0.5) / bands;
        const depthNeeded = yFrac * 100;
        const reached = sessionDepthList.filter(
          (s) => s.maxScrollDepth >= depthNeeded - 2
        ).length;
        const frac = reached / sessionDepthList.length;
        ctx.fillStyle = reachColor(frac, 0.95);
        ctx.fillRect(0, i * bandH, railW, bandH + 1);
      }
    }
  }, [metrics, mode, opacity, points, sessionDepthList, baseW]);

  const clickCount = points.length;
  const sessionCount = sessionDepthList.length;

  const sectionStats = React.useMemo(() => {
    if (!metrics) return [];
    return metrics.sections.map((s) => {
      const inSection = points.filter(
        (p) => p.y >= s.top && p.y < s.bottom
      ).length;
      return { id: s.id, clicks: inSection };
    });
  }, [metrics, points]);

  const maxSectionClicks = Math.max(1, ...sectionStats.map((s) => s.clicks));

  if (
    data &&
    Object.keys(data.heatmap.pointsByWidth ?? {}).length === 0 &&
    sessionDepthList.length === 0
  ) {
    return (
      <EmptyState
        title="No click data to map yet"
        description="Clicks recorded on the demo site will appear here as heatmaps, dot maps and scroll reach maps. You can also load sample data to see it in action immediately."
        action={
          <Button onClick={onSeed} className="font-semibold">
            Load sample data
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border bg-muted/40 p-1">
          {(
            [
              ["heatmap", "Heatmap", Flame],
              ["dots", "Click dots", MousePointerClick],
              ["scroll", "Scroll reach", MapIcon],
            ] as Array<[Mode, string, React.ElementType]>
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border bg-muted/40 p-1">
          {classes.map((c) => (
            <button
              key={c.cls}
              type="button"
              onClick={() => setDevice(c.cls)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                activeDevice === c.cls
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c.cls}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {mode === "heatmap" && (
          <div className="flex min-w-44 items-center gap-3 text-xs text-muted-foreground">
            <span className="shrink-0">Overlay</span>
            <Slider
              value={[opacity]}
              min={20}
              max={100}
              step={5}
              onValueChange={(v) => setOpacity(v[0] ?? 85)}
              className="flex-1"
            />
            <span className="shrink-0 tabular-nums">{opacity}%</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {/* page + overlay */}
        <Card className="overflow-hidden xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="capitalize">{activeDevice}</span> view
              <span className="text-sm font-normal text-muted-foreground">
                {clickCount.toLocaleString()} clicks ·{" "}
                {sessionCount.toLocaleString()} sessions ·{" "}
                {baseW}px layout
              </span>
              {rageCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                  {rageCount} rage-weighted points
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative max-h-[72vh] overflow-y-auto pp-scroll">
              <div
                ref={wrapRef}
                className="relative w-full"
                style={{ height: metrics ? metrics.pageH * metrics.scale : 600 }}
              >
                <div
                  ref={pageRef}
                  style={{
                    width: baseW,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transformOrigin: "0 0",
                    transform: metrics ? `scale(${metrics.scale})` : undefined,
                  }}
                >
                  <StaticDemo mode="static" />
                </div>
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none absolute left-0 top-0"
                  aria-hidden
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* side panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {mode === "heatmap" && (
                <>
                  <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#143ce6] via-[#3ca06e] via-60% to-[#eb3c32]" />
                  <p className="text-xs text-muted-foreground">
                    Cold (blue) = few clicks, hot (red) = dense click clusters.
                    Rage clicks are weighted heavier.
                  </p>
                </>
              )}
              {mode === "dots" && (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                    Normal click
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="grid h-4 w-4 place-items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40" />
                    </span>
                    Rage click cluster
                  </li>
                </ul>
              )}
              {mode === "scroll" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex h-3 flex-1 overflow-hidden rounded-full">
                      <div className="h-full flex-1 bg-[#eb463c]" />
                      <div className="h-full flex-1 bg-[#f59e0b]" />
                      <div className="h-full flex-1 bg-[#14b8a6]" />
                      <div className="h-full flex-1 bg-[#0f766e]" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Green = most visitors scroll this far. Red = few visitors
                    ever reach here. Dashed lines mark section boundaries.
                  </p>
                </>
              )}
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Heatmaps aggregate anonymous clicks from all recorded sessions.
                No personal data is stored.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Clicks per section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {sectionStats.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Measuring page...
                </p>
              )}
              {sectionStats.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{s.id}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.clicks}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all"
                      style={{
                        width: `${(s.clicks / maxSectionClicks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
