"use client";

// Small shared building blocks for the analytics dashboard.

import * as React from "react";
import {
  ArrowDownToLine,
  Eye,
  EyeOff,
  Focus,
  Keyboard,
  LayoutTemplate,
  Monitor,
  Moon,
  MousePointer2,
  MousePointerBan,
  MousePointerClick,
  Navigation,
  Play,
  Send,
  Smartphone,
  Square,
  Sun,
  Tablet,
  Timer,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventType } from "@/lib/tracker/types";

export function DeviceIcon({
  device,
  className,
}: {
  device: string;
  className?: string;
}) {
  if (device === "mobile")
    return <Smartphone className={cn("h-3.5 w-3.5", className)} />;
  if (device === "tablet")
    return <Tablet className={cn("h-3.5 w-3.5", className)} />;
  return <Monitor className={cn("h-3.5 w-3.5", className)} />;
}

export const EVENT_META: Record<
  EventType,
  { label: string; icon: React.ElementType; tone: string }
> = {
  session_start: {
    label: "Session started",
    icon: Play,
    tone: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
  },
  session_end: {
    label: "Session ended",
    icon: Square,
    tone: "text-muted-foreground bg-muted",
  },
  click: {
    label: "Click",
    icon: MousePointerClick,
    tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  rage_click: {
    label: "Rage click",
    icon: Zap,
    tone: "text-red-600 dark:text-red-400 bg-red-500/10",
  },
  mousemove: {
    label: "Cursor move",
    icon: MousePointer2,
    tone: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
  scroll: {
    label: "Scroll",
    icon: ArrowDownToLine,
    tone: "text-teal-600 dark:text-teal-300 bg-teal-500/10",
  },
  page_visibility: {
    label: "Tab visibility",
    icon: Eye,
    tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  },
  section_view: {
    label: "Section view",
    icon: LayoutTemplate,
    tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
  },
  idle_start: {
    label: "Went idle",
    icon: Moon,
    tone: "text-stone-500 bg-stone-500/10",
  },
  idle_end: {
    label: "Returned",
    icon: Sun,
    tone: "text-lime-600 dark:text-lime-400 bg-lime-500/10",
  },
  key_press: {
    label: "Keystroke",
    icon: Keyboard,
    tone: "text-muted-foreground bg-muted",
  },
  form_focus: {
    label: "Form focus",
    icon: Focus,
    tone: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
  },
  form_blur: {
    label: "Form blur",
    icon: Focus,
    tone: "text-muted-foreground bg-muted",
  },
  form_submit: {
    label: "Form submit",
    icon: Send,
    tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  resize: {
    label: "Resize",
    icon: Monitor,
    tone: "text-muted-foreground bg-muted",
  },
  nav_click: {
    label: "Navigation",
    icon: Navigation,
    tone: "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10",
  },
};

export function EventIcon({
  type,
  dead,
  rage,
  className,
}: {
  type: EventType;
  dead?: boolean;
  rage?: boolean;
  className?: string;
}) {
  const meta = EVENT_META[type] ?? EVENT_META.click;
  const Icon = meta.icon;
  if (type === "click" && rage) {
    return <Zap className={cn("h-3.5 w-3.5 text-red-500", className)} />;
  }
  if (type === "click" && dead) {
    return (
      <MousePointerBan className={cn("h-3.5 w-3.5 text-stone-400", className)} />
    );
  }
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

export function eventDescription(
  e: {
    type: EventType;
    targetText?: string | null;
    targetTag?: string | null;
    dead?: boolean;
    rage?: boolean;
    data?: Record<string, unknown>;
  },
  compact = true
): string {
  const d = e.data ?? {};
  switch (e.type) {
    case "click": {
      const target = e.targetText || e.targetTag || "element";
      if (e.rage) return `Rage-clicked ${target}`;
      if (e.dead) return `Dead click on ${target} (non-interactive)`;
      return `Clicked ${target}`;
    }
    case "rage_click":
      return `Burst of ${d.count ?? "?"} rapid clicks near "${
        d.text ?? "element"
      }"`;
    case "scroll":
      return `Scrolled to ${d.depth ?? "?"}% depth`;
    case "page_visibility":
      return d.visible ? "Tab became visible" : "Tab hidden (switched away)";
    case "section_view":
      return d.visible
        ? `Entered "${d.section}" section`
        : `Left "${d.section}" after ${Math.round(
            Number(d.dwellMs ?? 0) / 1000
          )}s`;
    case "nav_click":
      return `Jumped to "${d.to}" section`;
    case "form_focus":
      return `Focused ${d.formField ?? "form"} field`;
    case "form_blur":
      return `Left ${d.formField ?? "form"} field`;
    case "form_submit":
      return `Submitted ${d.formId ?? "form"}`;
    case "key_press":
      return d.inForm ? "Typing in form" : "Keystroke";
    case "idle_start":
      return "No activity for 15s";
    case "idle_end":
      return "Activity resumed";
    case "resize":
      return `Viewport ${d.viewportW ?? "?"}×${d.viewportH ?? "?"}`;
    case "mousemove":
      return "Cursor movement";
    case "session_start":
      return "New visitor session began";
    case "session_end":
      return "Session ended";
    default:
      return e.type;
  }
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone?: "teal" | "amber" | "red" | "stone" | "emerald";
}) {
  const tones: Record<string, string> = {
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    stone: "bg-stone-500/10 text-stone-600 dark:text-stone-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <Card className="py-4">
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {sub}
            </p>
          )}
        </div>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <Timer className="h-3 w-3" />
      Ended
    </Badge>
  );
}

export function DepthBar({ depth }: { depth: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={depth}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-400"
          style={{ width: `${Math.max(2, depth)}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">
        {depth}%
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
      <div className="max-w-md px-6">
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
