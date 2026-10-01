"use client";

// PathPulse behaviour tracker SDK.
// Captures rich interaction events inside a tracked container and ships them
// to /api/track in batches. Supports rage-click detection, dead-click
// classification, idle vs engaged time, per-section dwell and live overlays.

import {
  DeviceInfo,
  EventType,
  SessionSummary,
  TrackEvent,
  deviceTypeFromWidth,
} from "./types";

const VISITOR_KEY = "pp_visitor_id";
const SESSION_PREFIX = "pp_session";
const IDLE_TIMEOUT_MS = 15_000;
const MOVE_MIN_INTERVAL_MS = 70;
const MOVE_MIN_DISTANCE = 5;
const SCROLL_MIN_INTERVAL_MS = 200;
const KEY_THROTTLE_MS = 900;
const FLUSH_INTERVAL_MS = 4_000;
const MAX_BUFFER = 4_000;
const MAX_MOVE_POINTS = 6_000;
const BEACON_URL = "/api/track";

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, summary, [role="button"], [contenteditable="true"], [data-interactive]';

export interface LiveStats {
  eventCount: number;
  clickCount: number;
  rageClicks: number;
  deadClicks: number;
  moveCount: number;
  scrollCount: number;
  keyCount: number;
  engagedMs: number;
  idleMs: number;
  durationMs: number;
  maxScrollDepth: number;
  mouseDistance: number;
  active: boolean;
  idle: boolean;
  visible: boolean;
  sectionTimes: Record<string, number>;
}

interface StoredVisitor {
  id: string;
  firstSeen: number;
  lastSeen: number;
}

function rid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function deviceInfo(): DeviceInfo {
  const w = window.innerWidth;
  return {
    deviceType: deviceTypeFromWidth(w),
    viewportW: w,
    viewportH: window.innerHeight,
    screenWidth: window.screen?.width ?? w,
    screenHeight: window.screen?.height ?? window.innerHeight,
    language: navigator.language ?? "",
    platform: (navigator as unknown as { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform ?? "",
    userAgent: navigator.userAgent ?? "",
    referrer: document.referrer ?? "",
    touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
  };
}

export class PathPulseTracker {
  private container: HTMLElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private sessionId = rid("s");
  private visitorId = "";
  private returning = false;
  private startedAt = Date.now();
  private activeSince = Date.now();
  private accumulatedActiveMs = 0;

  private buffer: TrackEvent[] = [];
  private sent = 0;
  private sending = false;
  private ended = false;

  private listeners: (() => void)[] = [];
  private timers: ReturnType<typeof setInterval>[] = [];

  // summary state
  private clicks = 0;
  private rage = 0;
  private dead = 0;
  private moves = 0;
  private scrolls = 0;
  private keys = 0;
  private formSubmits = 0;
  private engagedMs = 0;
  private idleMs = 0;
  private maxDepth = 0;
  private mouseDistance = 0;
  private sectionTimes: Record<string, number> = {};
  private sectionStart: Record<string, number> = {};

  private lastMoveAt = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private lastScrollAt = 0;
  private lastKeyAt = 0;
  private lastActivityAt = Date.now();
  private recentClicks: { t: number; x: number; y: number }[] = [];

  private active = true;
  private idle = false;
  private visible = document.visibilityState === "visible";
  private observer: IntersectionObserver | null = null;
  private overlayEnabled = true;

  private statsCb: ((s: LiveStats) => void) | null = null;
  private statsTimer: ReturnType<typeof setInterval> | null = null;

  attach(container: HTMLElement) {
    if (this.container) return;
    this.container = container;
    this.loadVisitor();
    this.buildOverlay();
    this.bindEvents();
    this.timers.push(
      setInterval(() => this.tick(), 1000),
      setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
    );
    this.push({
      t: 0,
      type: "session_start",
      data: { url: location.href, title: document.title },
    });
    this.observeSections();
  }

  destroy() {
    this.endSession();
    this.listeners.forEach((off) => off());
    this.listeners = [];
    this.timers.forEach(clearInterval);
    this.timers = [];
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.observer?.disconnect();
    this.overlay?.remove();
    this.overlay = null;
  }

  onStats(cb: (s: LiveStats) => void) {
    this.statsCb = cb;
    this.statsTimer = setInterval(() => cb(this.stats()), 1000);
    cb(this.stats());
  }

  setActive(active: boolean) {
    if (active === this.active) return;
    if (!active) {
      this.accumulatedActiveMs += Date.now() - this.activeSince;
      this.endIdleIfNeeded(Date.now());
    } else {
      this.activeSince = Date.now();
      this.lastActivityAt = Date.now();
    }
    this.active = active;
    this.emitStats();
    this.flush();
  }

  setOverlayEnabled(enabled: boolean) {
    this.overlayEnabled = enabled;
    if (!enabled) this.clearOverlay();
  }

  sessionInfo() {
    return { sessionId: this.sessionId, visitorId: this.visitorId };
  }

  stats(): LiveStats {
    return {
      eventCount: this.sent + this.buffer.length,
      clickCount: this.clicks,
      rageClicks: this.rage,
      deadClicks: this.dead,
      moveCount: this.moves,
      scrollCount: this.scrolls,
      keyCount: this.keys,
      engagedMs: this.engagedMs,
      idleMs: this.idleMs,
      durationMs: this.duration(),
      maxScrollDepth: this.maxDepth,
      mouseDistance: this.mouseDistance,
      active: this.active,
      idle: this.idle,
      visible: this.visible,
      sectionTimes: { ...this.sectionTimes },
    };
  }

  clearOverlay() {
    if (this.overlay) this.overlay.replaceChildren();
  }

  private duration() {
    return (
      this.accumulatedActiveMs +
      (this.active ? Date.now() - this.activeSince : 0)
    );
  }

  private loadVisitor() {
    try {
      const raw = localStorage.getItem(VISITOR_KEY);
      const now = Date.now();
      if (raw) {
        const v = JSON.parse(raw) as StoredVisitor;
        this.visitorId = v.id;
        this.returning = now - v.lastSeen > 5 * 60_000;
        v.lastSeen = now;
        localStorage.setItem(VISITOR_KEY, JSON.stringify(v));
      } else {
        const v: StoredVisitor = { id: rid("v"), firstSeen: now, lastSeen: now };
        this.visitorId = v.id;
        localStorage.setItem(VISITOR_KEY, JSON.stringify(v));
      }
    } catch {
      this.visitorId = rid("v");
    }
  }

  private buildOverlay() {
    if (!this.container) return;
    const layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden;";
    this.container.appendChild(layer);
    this.overlay = layer;
  }

  private addOverlayDot(x: number, y: number, kind: "click" | "rage") {
    if (!this.overlayEnabled || !this.overlay) return;
    const dot = document.createElement("div");
    const size = kind === "rage" ? 22 : 14;
    dot.style.cssText = `position:absolute;left:${x - size / 2}px;top:${
      y - size / 2
    }px;width:${size}px;height:${size}px;border-radius:9999px;transition:opacity .4s;${
      kind === "rage"
        ? "background:rgba(239,68,68,.55);box-shadow:0 0 0 6px rgba(239,68,68,.18);"
        : "background:rgba(245,158,11,.85);box-shadow:0 0 0 5px rgba(245,158,11,.18);"
    }`;
    this.overlay.appendChild(dot);
    setTimeout(() => {
      dot.style.opacity = "0";
      setTimeout(() => dot.remove(), 500);
    }, 2200);
  }

  private geo() {
    const c = this.container;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const scrollY = window.scrollY;
    return {
      rect,
      scrollY,
      containerTopDoc: rect.top + scrollY,
      sw: c.scrollWidth,
      sh: c.scrollHeight,
    };
  }

  private coords(e: { clientX: number; clientY: number }) {
    const g = this.geo();
    if (!g) return null;
    return {
      x: Math.round((e.clientX - g.rect.left) * 10) / 10,
      y: Math.round((e.clientY - g.rect.top + g.scrollY) * 10) / 10,
      vx: e.clientX,
      vy: e.clientY,
      sy: Math.round(g.scrollY),
      sw: g.sw,
      sh: g.sh,
    };
  }

  private inContainer(target: EventTarget | null): target is Node {
    return (
      !!target && !!this.container && this.container.contains(target as Node)
    );
  }

  private bindEvents() {
    const doc = document;
    const onClick = (e: MouseEvent) => {
      if (!this.active || !this.inContainer(e.target)) return;
      this.handleClick(e);
    };
    const onMove = (e: MouseEvent) => {
      if (!this.active || !this.inContainer(e.target)) return;
      this.handleMove(e);
    };
    const onScroll = () => {
      if (!this.active) return;
      this.handleScroll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!this.active || !this.inContainer(e.target)) return;
      this.handleKey(e);
    };
    const onFocus = (e: FocusEvent) => {
      if (!this.active || !this.inContainer(e.target)) return;
      const el = e.target as HTMLElement;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      this.push({
        t: this.elapsed(),
        type: "form_focus",
        targetTag: el.tagName.toLowerCase(),
        targetId: el.id || undefined,
        data: {
          formField:
            el.getAttribute("name") ||
            el.getAttribute("aria-label") ||
            el.id ||
            "unnamed",
        },
      });
    };
    const onBlur = (e: FocusEvent) => {
      if (!this.inContainer(e.target)) return;
      const el = e.target as HTMLElement;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      this.push({
        t: this.elapsed(),
        type: "form_blur",
        targetTag: el.tagName.toLowerCase(),
        targetId: el.id || undefined,
        data: {
          formField:
            el.getAttribute("name") ||
            el.getAttribute("aria-label") ||
            el.id ||
            "unnamed",
        },
      });
    };
    const onSubmit = (e: SubmitEvent) => {
      if (!this.active || !this.inContainer(e.target)) return;
      this.formSubmits++;
      this.push({
        t: this.elapsed(),
        type: "form_submit",
        data: { formId: (e.target as HTMLElement).id || "form" },
      });
    };
    const onVisibility = () => {
      this.visible = document.visibilityState === "visible";
      if (!this.active) return;
      this.push({
        t: this.elapsed(),
        type: "page_visibility",
        data: { visible: this.visible, state: document.visibilityState },
      });
    };
    const onPageHide = () => {
      this.endSession();
      this.flush(true);
    };

    doc.addEventListener("click", onClick, true);
    doc.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    doc.addEventListener("keydown", onKey, true);
    doc.addEventListener("focusin", onFocus, true);
    doc.addEventListener("focusout", onBlur, true);
    doc.addEventListener("submit", onSubmit, true);
    doc.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!this.active) return;
        const g = this.geo();
        if (!g) return;
        this.push({
          t: this.elapsed(),
          type: "resize",
          data: {
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
            sw: g.sw,
            sh: g.sh,
          },
        });
      }, 400);
    };
    window.addEventListener("resize", onResize);

    this.listeners.push(
      () => doc.removeEventListener("click", onClick, true),
      () => doc.removeEventListener("mousemove", onMove),
      () => window.removeEventListener("scroll", onScroll),
      () => doc.removeEventListener("keydown", onKey, true),
      () => doc.removeEventListener("focusin", onFocus, true),
      () => doc.removeEventListener("focusout", onBlur, true),
      () => doc.removeEventListener("submit", onSubmit, true),
      () => doc.removeEventListener("visibilitychange", onVisibility),
      () => window.removeEventListener("pagehide", onPageHide),
      () => window.removeEventListener("resize", onResize)
    );
  }

  private labelOf(el: HTMLElement) {
    let label = el.tagName.toLowerCase();
    if (el.id) label += `#${el.id}`;
    const cls =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/).filter(Boolean)[0]
        : "";
    if (cls && !el.id) label += `.${cls}`;
    return label;
  }

  private handleClick(e: MouseEvent) {
    const el = e.target as HTMLElement;
    if (!el || !el.tagName) return;
    const coords = this.coords(e);
    if (!coords) return;
    const now = Date.now();

    const interactive = !!el.closest(INTERACTIVE_SELECTOR);
    this.recentClicks.push({ t: now, x: coords.x, y: coords.y });
    this.recentClicks = this.recentClicks.filter((c) => now - c.t <= 1000);
    const rageHit =
      this.recentClicks.length >= 3 &&
      this.recentClicks.every(
        (c) =>
          Math.hypot(c.x - coords.x, c.y - coords.y) <= 90
      );

    const nav = el.closest("[data-nav]") as HTMLElement | null;
    const text = (el.innerText || el.getAttribute("aria-label") || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);

    this.clicks++;
    if (!interactive) this.dead++;
    if (rageHit) this.rage++;

    this.push({
      t: this.elapsed(),
      type: "click",
      ...coords,
      targetTag: el.tagName.toLowerCase(),
      targetId: el.id || undefined,
      targetText: text || undefined,
      targetClasses:
        typeof el.className === "string" && el.className.trim()
          ? el.className.trim().split(/\s+/).slice(0, 3).join(" ")
          : undefined,
      dead: !interactive || undefined,
      rage: rageHit || undefined,
      data: { interactive, clickNumber: this.clicks },
    });

    if (nav) {
      this.push({
        t: this.elapsed(),
        type: "nav_click",
        ...coords,
        targetTag: el.tagName.toLowerCase(),
        targetText: text || undefined,
        data: { to: nav.dataset.nav },
      });
    }

    if (rageHit) {
      this.push({
        t: this.elapsed(),
        type: "rage_click",
        x: coords.x,
        y: coords.y,
        sw: coords.sw,
        sh: coords.sh,
        data: {
          count: this.recentClicks.length,
          windowMs: 1000,
          label: this.labelOf(el),
          text,
        },
      });
      this.recentClicks = [];
    }

    this.addOverlayDot(coords.x, coords.y, rageHit ? "rage" : "click");
    this.lastActivityAt = now;
    this.emitStats();
  }

  private handleMove(e: MouseEvent) {
    const now = performance.now();
    if (now - this.lastMoveAt < MOVE_MIN_INTERVAL_MS) return;
    if (this.moves >= MAX_MOVE_POINTS) return;
    const dx = e.clientX - this.lastMoveX;
    const dy = e.clientY - this.lastMoveY;
    if (this.moves > 0 && Math.hypot(dx, dy) < MOVE_MIN_DISTANCE) return;
    const coords = this.coords(e);
    if (!coords) return;
    this.lastMoveAt = now;
    this.lastMoveX = e.clientX;
    this.lastMoveY = e.clientY;
    this.mouseDistance += Math.hypot(dx, dy);
    this.moves++;
    this.lastActivityAt = Date.now();
    this.push({
      t: this.elapsed(),
      type: "mousemove",
      x: coords.x,
      y: coords.y,
      vx: coords.vx,
      vy: coords.vy,
      sy: coords.sy,
      sw: coords.sw,
      sh: coords.sh,
    });
  }

  private handleScroll() {
    const now = performance.now();
    if (now - this.lastScrollAt < SCROLL_MIN_INTERVAL_MS) return;
    const g = this.geo();
    if (!g) return;
    this.lastScrollAt = now;
    const depth = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((window.scrollY + window.innerHeight - g.containerTopDoc) /
            Math.max(1, g.sh)) *
            100
        )
      )
    );
    this.maxDepth = Math.max(this.maxDepth, depth);
    this.scrolls++;
    this.lastActivityAt = Date.now();
    this.push({
      t: this.elapsed(),
      type: "scroll",
      sy: Math.round(window.scrollY),
      sw: g.sw,
      sh: g.sh,
      data: { depth },
    });
    this.emitStats();
  }

  private handleKey(_e: KeyboardEvent) {
    this.keys++;
    this.lastActivityAt = Date.now();
    const now = performance.now();
    if (now - this.lastKeyAt < KEY_THROTTLE_MS) return;
    this.lastKeyAt = now;
    this.push({
      t: this.elapsed(),
      type: "key_press",
      data: {
        inForm: !!(_e.target as HTMLElement)?.closest?.(
          "input, textarea, select"
        ),
      },
    });
  }

  private observeSections() {
    if (!this.container || !("IntersectionObserver" in window)) return;
    const sections = this.container.querySelectorAll<HTMLElement>(
      "[data-section]"
    );
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-section");
          if (!id || !this.active) continue;
          const visible =
            entry.isIntersecting && entry.intersectionRatio >= 0.35;
          const started = this.sectionStart[id];
          if (visible && started === undefined) {
            this.sectionStart[id] = Date.now();
            this.push({
              t: this.elapsed(),
              type: "section_view",
              data: { section: id, visible: true },
            });
          } else if (!visible && started !== undefined) {
            const dwell = Date.now() - started;
            this.sectionTimes[id] = (this.sectionTimes[id] ?? 0) + dwell;
            delete this.sectionStart[id];
            this.push({
              t: this.elapsed(),
              type: "section_view",
              data: { section: id, visible: false, dwellMs: dwell },
            });
          }
        }
      },
      { threshold: [0, 0.35, 0.6, 1] }
    );
    sections.forEach((s) => this.observer?.observe(s));
  }

  private tick() {
    if (!this.active) return;
    const now = Date.now();
    if (!this.idle && now - this.lastActivityAt > IDLE_TIMEOUT_MS) {
      this.idle = true;
      this.push({ t: this.elapsed(), type: "idle_start" });
    }
    if (this.idle && now - this.lastActivityAt <= IDLE_TIMEOUT_MS) {
      this.idle = false;
      this.push({ t: this.elapsed(), type: "idle_end" });
    }
    if (this.visible && !this.idle) this.engagedMs += 1000;
    else if (this.idle) this.idleMs += 1000;
    // close out long-running section dwell periodically
    for (const [id, started] of Object.entries(this.sectionStart)) {
      if (now - started > 30_000) {
        this.sectionTimes[id] = (this.sectionTimes[id] ?? 0) + (now - started);
        this.sectionStart[id] = now;
      }
    }
  }

  private endIdleIfNeeded(now: number) {
    if (this.idle) {
      this.idle = false;
      this.push({ t: this.elapsed(), type: "idle_end" });
      this.lastActivityAt = now;
    }
  }

  private elapsed() {
    return Math.round(this.duration());
  }

  private push(ev: TrackEvent) {
    this.buffer.push(ev);
    if (this.buffer.length > MAX_BUFFER) this.buffer.shift();
  }

  private summary(): SessionSummary {
    return {
      durationMs: this.duration(),
      engagedMs: this.engagedMs,
      idleMs: this.idleMs,
      clickCount: this.clicks,
      rageClicks: this.rage,
      deadClicks: this.dead,
      moveCount: this.moves,
      scrollCount: this.scrolls,
      keyCount: this.keys,
      formSubmits: this.formSubmits,
      maxScrollDepth: this.maxDepth,
      mouseDistance: Math.round(this.mouseDistance),
      pageHeight: this.geo()?.sh ?? 0,
      sectionTimes: { ...this.sectionTimes },
    };
  }

  private payload(ended: boolean) {
    return {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      startedAt: new Date(this.startedAt).toISOString(),
      ended,
      device: deviceInfo(),
      returning: this.returning,
      summary: this.summary(),
      events: this.buffer,
    };
  }

  private endSession() {
    if (this.ended) return;
    this.ended = true;
    for (const [id, started] of Object.entries(this.sectionStart)) {
      this.sectionTimes[id] = (this.sectionTimes[id] ?? 0) + (Date.now() - started);
    }
    this.push({ t: this.elapsed(), type: "session_end" });
  }

  async flush(ended = false) {
    if (this.sending || (this.buffer.length === 0 && !ended)) return;
    const body = JSON.stringify(this.payload(ended || this.ended));
    const events = this.buffer.length;
    this.sending = true;
    try {
      const res = await fetch(BEACON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
      if (res.ok) {
        this.buffer = [];
        this.sent += events;
      }
    } catch {
      // keep buffer, retry on next interval
    } finally {
      this.sending = false;
    }
  }

  beacon() {
    try {
      this.endSession();
      const blob = new Blob([JSON.stringify(this.payload(true))], {
        type: "application/json",
      });
      navigator.sendBeacon(BEACON_URL, blob);
      this.buffer = [];
    } catch {
      /* noop */
    }
  }

  private emitStats() {
    this.statsCb?.(this.stats());
  }
}

declare global {
  interface Window {
    PathPulse?: {
      tracker: PathPulseTracker;
      flush: () => void;
      stats: () => LiveStats;
    };
  }
}
