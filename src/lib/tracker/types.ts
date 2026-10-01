// Shared types for the PathPulse behaviour tracker.

export type DeviceType = "desktop" | "tablet" | "mobile";

export type EventType =
  | "session_start"
  | "click"
  | "rage_click"
  | "mousemove"
  | "scroll"
  | "page_visibility"
  | "section_view"
  | "idle_start"
  | "idle_end"
  | "key_press"
  | "form_focus"
  | "form_blur"
  | "form_submit"
  | "resize"
  | "nav_click"
  | "session_end";

/** A single captured interaction, wire format sent to /api/track. */
export interface TrackEvent {
  t: number; // ms since session start
  type: EventType;
  x?: number; // x within demo page content
  y?: number; // y within demo page content (scroll-independent)
  vx?: number; // viewport x
  vy?: number; // viewport y
  sy?: number; // window scrollY
  sw?: number; // demo page content width
  sh?: number; // demo page content height
  targetTag?: string;
  targetId?: string;
  targetText?: string;
  targetClasses?: string;
  dead?: boolean; // click landed on a non-interactive element
  rage?: boolean; // part of a rage-click cluster
  data?: Record<string, unknown>;
}

export interface DeviceInfo {
  deviceType: DeviceType;
  viewportW: number;
  viewportH: number;
  screenWidth: number;
  screenHeight: number;
  language: string;
  platform: string;
  userAgent: string;
  referrer: string;
  touch: boolean;
}

export interface SessionSummary {
  durationMs: number;
  engagedMs: number;
  idleMs: number;
  clickCount: number;
  rageClicks: number;
  deadClicks: number;
  moveCount: number;
  scrollCount: number;
  keyCount: number;
  formSubmits: number;
  maxScrollDepth: number;
  mouseDistance: number;
  pageHeight: number;
  sectionTimes: Record<string, number>;
}

/** Payload posted to /api/track. */
export interface TrackPayload {
  sessionId: string;
  visitorId: string;
  startedAt: string;
  ended: boolean;
  device: DeviceInfo;
  returning: boolean;
  summary: SessionSummary;
  events: TrackEvent[];
}

export interface SessionDTO {
  id: string;
  visitorId: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  durationMs: number;
  engagedMs: number;
  idleMs: number;
  clickCount: number;
  rageClicks: number;
  deadClicks: number;
  moveCount: number;
  scrollCount: number;
  keyCount: number;
  formSubmits: number;
  maxScrollDepth: number;
  mouseDistance: number;
  viewportW: number;
  viewportH: number;
  deviceType: DeviceType;
  language: string;
  platform: string;
  referrer: string;
  returning: boolean;
  sectionTimes: Record<string, number>;
  isSeed: boolean;
  live: boolean;
  eventCount?: number;
}

export interface EventDTO {
  id: string;
  sessionId: string;
  t: number;
  type: EventType;
  x: number | null;
  y: number | null;
  vx: number | null;
  vy: number | null;
  sy: number | null;
  sw: number | null;
  sh: number | null;
  targetTag: string | null;
  targetId: string | null;
  targetText: string | null;
  targetClasses: string | null;
  dead: boolean;
  rage: boolean;
  data: Record<string, unknown>;
}

export const SECTION_IDS = [
  "hero",
  "features",
  "shop",
  "pricing",
  "reviews",
  "faq",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function deviceTypeFromWidth(w: number): DeviceType {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}
