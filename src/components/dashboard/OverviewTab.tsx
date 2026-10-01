"use client";

// Overview tab: KPIs, engagement charts, scroll behaviour, top elements.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  Clock,
  Eye,
  Gauge,
  MousePointerClick,
  MousePointerBan,
  Send,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KpiCard, EmptyState } from "./shared";
import { AnalyticsResponse } from "./types";
import { fmtDuration } from "@/lib/tracker/format";
import { SECTION_IDS } from "@/lib/tracker/types";

const GRID = "rgba(128,128,128,0.16)";
const TICK = { fill: "#9ca3af", fontSize: 11 } as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold">{label ?? payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-muted-foreground">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#0d9488",
  mobile: "#f59e0b",
  tablet: "#78716c",
};

export function OverviewTab({
  data,
  onSeed,
}: {
  data: AnalyticsResponse | undefined;
  onSeed: () => void;
}) {
  const t = data?.totals;
  if (data && t && t.sessions === 0) {
    return (
      <EmptyState
        title="Nothing to analyse yet"
        description="Browse the demo site for a minute (every interaction is captured), or load sample data to fill the dashboard with simulated visitor sessions."
        action={
          <button
            onClick={onSeed}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Load sample data
          </button>
        }
      />
    );
  }

  const timeline = (data?.eventsTimeline ?? []).map((b) => ({
    ...b,
    time: new Date(b.time).toLocaleTimeString([], {
      minute: "2-digit",
      second: "2-digit",
    }),
  }));
  const histogram = data?.scrollHistogram ?? [];
  const devices = data?.devices ?? [];
  const totalDevices = devices.reduce((a, d) => a + d.count, 0) || 1;
  const sectionData = SECTION_IDS.map((id) => {
    const found = data?.sections?.find((s) => s.section === id);
    return {
      section: id,
      seconds: found ? Math.round(found.avgMs / 1000) : 0,
      sessions: found?.sessions ?? 0,
    };
  });
  const topTargets = (data?.topTargets ?? [])
    .slice(0, 7)
    .map((x) => ({
      ...x,
      label:
        x.label.length > 22 ? `${x.label.slice(0, 21)}…` : x.label,
    }));

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Sessions"
          value={`${t?.sessions ?? 0}`}
          sub={`${t?.returning ?? 0} returning`}
          icon={Users}
        />
        <KpiCard
          label="Avg engaged time"
          value={fmtDuration(t?.avgEngagedMs ?? 0)}
          sub={`of ${fmtDuration(t?.avgDurationMs ?? 0)} avg visit`}
          icon={Clock}
          tone="emerald"
        />
        <KpiCard
          label="Avg scroll depth"
          value={`${t?.avgScrollDepth ?? 0}%`}
          sub="how far visitors get"
          icon={Gauge}
          tone="stone"
        />
        <KpiCard
          label="Avg clicks / session"
          value={`${t?.avgClicks ?? 0}`}
          sub={`${t?.clicks ?? 0} clicks total`}
          icon={MousePointerClick}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* engagement timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Activity — last 10 minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={TICK}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="events"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* scroll histogram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Scroll depth distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="range" tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
                  <Bar dataKey="sessions" name="sessions" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {histogram.map((_, i) => (
                      <Cell
                        key={i}
                        fill={["#f87171", "#fb923c", "#facc15", "#4ade80", "#14b8a6"][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* devices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sessions by device</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="h-[200px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="count"
                    nameKey="device"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {devices.map((d) => (
                      <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? "#0d9488"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {devices.map((d) => (
                <li key={d.device} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: DEVICE_COLORS[d.device] ?? "#0d9488" }}
                  />
                  <span className="capitalize">{d.device}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {Math.round((d.count / totalDevices) * 100)}% · {d.count}
                  </span>
                </li>
              ))}
              {devices.length === 0 && (
                <li className="text-sm text-muted-foreground">No data yet</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* section engagement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Avg dwell time per section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectionData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="section"
                    tick={TICK}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
                  <Bar dataKey="seconds" name="avg seconds" radius={[0, 6, 6, 0]} fill="#14b8a6" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* top elements */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Most-clicked elements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTargets.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No clicks recorded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {topTargets.map((target, i) => {
                  const max = topTargets[0].clicks || 1;
                  return (
                    <li key={target.label} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium">
                          {i + 1}. {target.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {target.clicks} clicks
                          {target.rage > 0 && (
                            <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-red-500">
                              {target.rage} rage
                            </span>
                          )}
                          {target.dead > 0 && (
                            <span className="ml-2 rounded bg-stone-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500">
                              {target.dead} dead
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            target.rage > 0
                              ? "bg-gradient-to-r from-red-400 to-red-500"
                              : "bg-gradient-to-r from-teal-500 to-amber-400"
                          )}
                          style={{ width: `${Math.max(4, (target.clicks / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* frustration signals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Frustration signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                icon: Zap,
                label: "Rage clicks",
                value: t?.rageClicks ?? 0,
                hint: "3+ rapid clicks in one spot",
                tone: "text-red-500 bg-red-500/10",
              },
              {
                icon: MousePointerBan,
                label: "Dead clicks",
                value: t?.deadClicks ?? 0,
                hint: "clicks on non-interactive areas",
                tone: "text-stone-500 bg-stone-500/10",
              },
              {
                icon: Eye,
                label: "Tab switches",
                value: data?.recentEvents.filter(
                  (e) => e.type === "page_visibility"
                ).length ?? 0,
                hint: "visible in latest events",
                tone: "text-violet-500 bg-violet-500/10",
              },
              {
                icon: Send,
                label: "Form submissions",
                value: t?.formSubmits ?? 0,
                hint: "completed contact forms",
                tone: "text-emerald-500 bg-emerald-500/10",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
              >
                <span className={cn("grid h-9 w-9 place-items-center rounded-lg", row.tone)}>
                  <row.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none tabular-nums">
                    {row.value}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {row.label} — {row.hint}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
