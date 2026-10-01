import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Generates realistic sample sessions so the dashboard is immediately useful.
// Coordinates approximate the Lumina Voyages demo layout at three widths.

type SeedEvent = {
  t: number;
  type: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  sy?: number;
  sw?: number;
  sh?: number;
  targetTag?: string;
  targetId?: string;
  targetText?: string;
  dead?: boolean;
  rage?: boolean;
  data?: Record<string, unknown>;
};

type Persona =
  | "buyer"
  | "browser"
  | "researcher"
  | "rage"
  | "bouncer"
  | "tabswitch"
  | "idle";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const jitter = (v: number, amount: number) => v + rand(-amount, amount);

// Layout coordinates were measured from the real rendered demo page
// (see browser measurements) so seeded heatmap blobs land on actual UI.

const LAYOUT = {
  desktop: {
    sw: 1512,
    sh: 4551,
    sections: {
      hero: [77, 915],
      features: [915, 1423],
      shop: [1423, 2071],
      pricing: [2071, 2697],
      reviews: [2697, 3135],
      faq: [3135, 3623],
      contact: [3623, 4143],
    } as Record<string, [number, number]>,
    heroCta: { x: 277, y: 655 },
    addCart: [
      { x: 364, y: 1941, label: "Reserve spot" },
      { x: 756, y: 1941, label: "Reserve spot" },
      { x: 1148, y: 1964, label: "Reserve spot" },
    ],
    plans: [
      { x: 364, y: 2555, label: "Choose Explorer" },
      { x: 756, y: 2569, label: "Choose Voyager" },
      { x: 1148, y: 2585, label: "Choose Luminary" },
    ],
    nav: { x: 768, y: 38 },
    faqRow: { x: 756, y: 3301 },
    form: [
      { x: 1054, y: 3756, field: "name" },
      { x: 1054, y: 3834, field: "email" },
      { x: 1054, y: 3926, field: "message" },
    ],
    formSubmit: { x: 1054, y: 3996 },
  },
  mobile: {
    sw: 375,
    sh: 8359,
    sections: {
      hero: [77, 900],
      features: [900, 2132],
      shop: [2132, 3720],
      pricing: [3720, 5096],
      reviews: [5096, 6090],
      faq: [6090, 6598],
      contact: [6598, 7524],
    } as Record<string, [number, number]>,
    heroCta: { x: 121, y: 580 },
    addCart: [
      { x: 188, y: 2749, label: "Reserve spot" },
      { x: 188, y: 3181, label: "Reserve spot" },
      { x: 188, y: 3613, label: "Reserve spot" },
    ],
    plans: [
      { x: 188, y: 4224, label: "Choose Explorer" },
      { x: 188, y: 4604, label: "Choose Voyager" },
      { x: 188, y: 4984, label: "Choose Luminary" },
    ],
    nav: { x: 188, y: 38 },
    faqRow: { x: 188, y: 6264 },
    form: [
      { x: 188, y: 7119, field: "name" },
      { x: 188, y: 7197, field: "email" },
      { x: 188, y: 7290, field: "message" },
    ],
    formSubmit: { x: 188, y: 7361 },
  },
  tablet: {
    sw: 834,
    sh: 5210,
    sections: {
      hero: [121, 808],
      features: [808, 1422],
      shop: [1422, 2165],
      pricing: [2165, 2831],
      reviews: [2831, 3393],
      faq: [3393, 3881],
      contact: [3881, 4767],
    } as Record<string, [number, number]>,
    heroCta: { x: 137, y: 548 },
    addCart: [
      { x: 158, y: 2058, label: "Reserve spot" },
      { x: 417, y: 2014, label: "Reserve spot" },
      { x: 676, y: 2014, label: "Reserve spot" },
    ],
    plans: [
      { x: 158, y: 2649, label: "Choose Explorer" },
      { x: 417, y: 2703, label: "Choose Voyager" },
      { x: 676, y: 2679, label: "Choose Luminary" },
    ],
    nav: { x: 413, y: 60 },
    faqRow: { x: 417, y: 3559 },
    form: [
      { x: 417, y: 4380, field: "name" },
      { x: 417, y: 4458, field: "email" },
      { x: 417, y: 4550, field: "message" },
    ],
    formSubmit: { x: 417, y: 4620 },
  },
};

type Layout = typeof LAYOUT.desktop;

function deviceLayout(deviceType: string): Layout {
  if (deviceType === "mobile") return LAYOUT.mobile;
  if (deviceType === "tablet") return LAYOUT.tablet;
  return LAYOUT.desktop;
}

function scrollTo(
  events: SeedEvent[],
  t: number,
  fromY: number,
  toY: number,
  layout: Layout,
  speed = 700
): number {
  // Simulates smooth scrolling with periodic scroll + mousemove events.
  let cur = fromY;
  let time = t;
  const step = rand(90, 160);
  while (Math.abs(toY - cur) > step) {
    cur += Math.sign(toY - cur) * step * rand(0.7, 1.2);
    time += rand(160, 320);
    const depth = Math.min(
      100,
      Math.round(((cur + 800) / layout.sh) * 100)
    );
    events.push({
      t: Math.round(time),
      type: "scroll",
      sy: Math.round(cur),
      sw: layout.sw,
      sh: layout.sh,
      data: { depth },
    });
    events.push({
      t: Math.round(time),
      type: "mousemove",
      x: jitter(layout.sw / 2, layout.sw * 0.2),
      y: Math.round(cur + rand(300, 600)),
      vx: jitter(layout.sw / 2, 100),
      vy: rand(300, 600),
      sy: Math.round(cur),
      sw: layout.sw,
      sh: layout.sh,
    });
  }
  return time;
}

function moveTo(
  events: SeedEvent[],
  t: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  layout: Layout,
  sy: number
): number {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(4, Math.min(18, Math.round(dist / 90)));
  let time = t;
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    time += rand(90, 200);
    const p = {
      x: jitter(from.x + ((to.x - from.x) * i) / steps, 24),
      y: jitter(from.y + ((to.y - from.y) * i) / steps, 24),
    };
    events.push({
      t: Math.round(time),
      type: "mousemove",
      x: Math.round(p.x),
      y: Math.round(p.y),
      vx: Math.round(p.x),
      vy: Math.round(p.y - sy),
      sy: Math.round(sy),
      sw: layout.sw,
      sh: layout.sh,
    });
    prev = p;
  }
  void prev;
  return time;
}

function clickAt(
  events: SeedEvent[],
  t: number,
  x: number,
  y: number,
  layout: Layout,
  sy: number,
  opts: { text?: string; dead?: boolean; rage?: boolean; tag?: string } = {}
): number {
  events.push({
    t: Math.round(t),
    type: "click",
    x: Math.round(x),
    y: Math.round(y),
    vx: Math.round(x),
    vy: Math.round(y - sy),
    sy: Math.round(sy),
    sw: layout.sw,
    sh: layout.sh,
    targetTag: opts.tag ?? "button",
    targetText: opts.text,
    dead: opts.dead || undefined,
    rage: opts.rage || undefined,
    data: { interactive: !opts.dead, simulated: true },
  });
  return t;
}

function sectionViews(
  events: SeedEvent[],
  visited: string[],
  layout: Layout,
  dwellMs: Record<string, number>
) {
  let t = 0;
  for (const sec of visited) {
    const dwell = dwellMs[sec] ?? rand(4000, 14000);
    events.push({
      t: Math.round(t),
      type: "section_view",
      data: { section: sec, visible: true },
    });
    t += dwell;
    events.push({
      t: Math.round(t),
      type: "section_view",
      data: { section: sec, visible: false, dwellMs: Math.round(dwell) },
    });
  }
}

const PERSONAS: Persona[] = [
  "buyer",
  "browser",
  "researcher",
  "rage",
  "bouncer",
  "tabswitch",
  "idle",
  "browser",
  "researcher",
  "buyer",
  "rage",
  "browser",
];

function generateSession(index: number) {
  const persona = PERSONAS[index % PERSONAS.length];
  const deviceType = pick<string>(["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"]);
  const layout = deviceLayout(deviceType);
  const viewportW = deviceType === "mobile" ? 390 : layout.sw;
  const viewportH = deviceType === "mobile" ? 844 : 900;
  const events: SeedEvent[] = [];
  const sectionDwell: Record<string, number> = {};

  const start = { x: jitter(layout.sw / 2, 200), y: 320 };
  events.push({ t: 0, type: "session_start", data: { simulated: true } });

  let t = 0;
  let sy = 0;
  let cursor = { ...start };
  const visited: string[] = [];

  const visit = (sec: string) => {
    if (!visited.includes(sec)) visited.push(sec);
  };

  // every persona lands on the hero first
  t = moveTo(events, t, cursor, { x: jitter(start.x, 150), y: 500 }, layout, sy);
  cursor = { x: start.x, y: 500 };
  visit("hero");
  sectionDwell.hero = rand(6000, 12000);
  t += 2500;

  if (persona === "bouncer") {
    t = moveTo(events, t, cursor, layout.heroCta, layout, sy);
    cursor = { ...layout.heroCta };
    if (Math.random() < 0.5) {
      t = clickAt(events, t, cursor.x, cursor.y, layout, sy, {
        text: "Reserve your seat",
      });
    } else {
      t = clickAt(events, t, jitter(400, 120), 400, layout, sy, {
        dead: true,
        tag: "p",
        text: "hero copy",
      });
    }
    sectionDwell.hero = t;
  } else if (persona === "buyer") {
    t = moveTo(events, t, cursor, layout.heroCta, layout, sy);
    cursor = { ...layout.heroCta };
    t = clickAt(events, t, cursor.x, cursor.y, layout, sy, {
      text: "Reserve your seat",
    });
    t += rand(800, 1600);
    const targetY = layout.sections.pricing[0] + 300;
    t = scrollTo(events, t, sy, targetY, layout);
    sy = targetY;
    visit("features");
    sectionDwell.features = rand(3000, 6000);
    visit("shop");
    sectionDwell.shop = rand(3000, 8000);
    visit("pricing");
    sectionDwell.pricing = rand(8000, 16000);
    const plan = pick(layout.plans);
    t = moveTo(
      events,
      t,
      { x: layout.sw / 2, y: sy + 400 },
      { x: plan.x, y: plan.y },
      layout,
      sy
    );
    cursor = { x: plan.x, y: plan.y };
    t = clickAt(events, t, plan.x, plan.y, layout, sy, { text: plan.label });
    t += rand(1500, 4000);
  } else if (persona === "browser") {
    const stops = ["features", "shop", "pricing", "reviews", "faq"] as const;
    for (const sec of stops) {
      const [top] = layout.sections[sec];
      const targetY = Math.min(top + 100, layout.sh - 900);
      t = scrollTo(events, t, sy, targetY, layout);
      sy = targetY;
      visit(sec);
      sectionDwell[sec] = rand(5000, 12000);
      t += sectionDwell[sec];
      if (sec === "shop" && Math.random() < 0.8) {
        const item = pick(layout.addCart);
        t = moveTo(events, t, { x: layout.sw / 2, y: sy + 400 }, item, layout, sy);
        t = clickAt(events, t, item.x, item.y, layout, sy, { text: item.label });
        t += rand(600, 1800);
      }
      if (sec === "pricing" && Math.random() < 0.6) {
        const plan = pick(layout.plans);
        t = moveTo(events, t, { x: layout.sw / 2, y: sy + 400 }, plan, layout, sy);
        t = clickAt(events, t, plan.x, plan.y, layout, sy, { text: plan.label });
        t += rand(800, 2000);
      }
      if (Math.random() < 0.3) {
        // dead click on plain content
        t = clickAt(events, t, jitter(layout.sw / 2, 300), sy + rand(200, 700), layout, sy, {
          dead: true,
          tag: "p",
          text: "section copy",
        });
        t += rand(400, 900);
      }
    }
  } else if (persona === "researcher") {
    const stops = ["features", "faq", "contact"] as const;
    for (const sec of stops) {
      const [top] = layout.sections[sec];
      const targetY = Math.min(top + 100, layout.sh - 900);
      t = scrollTo(events, t, sy, targetY, layout);
      sy = targetY;
      visit(sec);
      sectionDwell[sec] = rand(9000, 20000);
      t += sectionDwell[sec];
    }
    // read FAQ (click a row)
    t = moveTo(events, t, { x: layout.sw / 2, y: sy + 400 }, layout.faqRow, layout, sy);
    t = clickAt(events, t, layout.faqRow.x, layout.faqRow.y, layout, sy, {
      tag: "button",
      text: "When does the next expedition leave?",
    });
    t += rand(2000, 5000);
    // fill the form
    for (const field of layout.form) {
      t = moveTo(events, t, { x: layout.sw / 2, y: sy + 500 }, field, layout, sy);
      t += 200;
      events.push({
        t: Math.round(t),
        type: "form_focus",
        targetTag: "input",
        data: { formField: field.field },
      });
      t += rand(2000, 4000);
      for (let k = 0; k < 5; k++) {
        events.push({
          t: Math.round(t),
          type: "key_press",
          data: { inForm: true },
        });
        t += rand(150, 450);
      }
      events.push({
        t: Math.round(t),
        type: "form_blur",
        targetTag: "input",
        data: { formField: field.field },
      });
      t += rand(300, 900);
    }
    t = moveTo(events, t, { x: layout.sw / 2, y: sy + 500 }, layout.formSubmit, layout, sy);
    t = clickAt(events, t, layout.formSubmit.x, layout.formSubmit.y, layout, sy, {
      tag: "button",
      text: "Send message",
    });
    events.push({
      t: Math.round(t + 400),
      type: "form_submit",
      data: { formId: "contact-form" },
    });
    t += rand(2000, 6000);
  } else if (persona === "rage") {
    const targetY = layout.sections.pricing[0] + 300;
    t = scrollTo(events, t, sy, targetY, layout);
    sy = targetY;
    visit("features");
    sectionDwell.features = rand(2000, 5000);
    visit("shop");
    sectionDwell.shop = rand(2000, 5000);
    visit("pricing");
    sectionDwell.pricing = rand(6000, 12000);
    const plan = layout.plans[1];
    t = moveTo(events, t, { x: layout.sw / 2, y: sy + 400 }, plan, layout, sy);
    // rage burst: 4 clicks in 1.2s within a tight radius
    const cx = plan.x;
    const cy = plan.y;
    for (let i = 0; i < 4; i++) {
      t += rand(180, 340);
      t = clickAt(events, t, jitter(cx, 14), jitter(cy, 10), layout, sy, {
        text: plan.label,
        rage: i >= 2,
      });
    }
    events.push({
      t: Math.round(t + 100),
      type: "rage_click",
      x: Math.round(cx),
      y: Math.round(cy),
      sw: layout.sw,
      sh: layout.sh,
      data: { count: 4, windowMs: 1200, label: "button", text: plan.label },
    });
    t += rand(3000, 6000);
  } else if (persona === "tabswitch") {
    t += rand(4000, 9000);
    events.push({
      t: Math.round(t),
      type: "page_visibility",
      data: { visible: false, state: "hidden" },
    });
    t += rand(8000, 25000);
    events.push({
      t: Math.round(t),
      type: "page_visibility",
      data: { visible: true, state: "visible" },
    });
    const targetY = layout.sections.shop[0] + 200;
    t = scrollTo(events, t, sy, targetY, layout);
    sy = targetY;
    visit("features");
    sectionDwell.features = rand(3000, 7000);
    visit("shop");
    sectionDwell.shop = rand(6000, 12000);
    t += 4000;
  } else {
    // idle persona
    t += rand(5000, 10000);
    events.push({ t: Math.round(t), type: "idle_start" });
    t += rand(25000, 50000);
    events.push({ t: Math.round(t), type: "idle_end" });
    const targetY = layout.sections.features[0] + 150;
    t = scrollTo(events, t, sy, targetY, layout);
    sy = targetY;
    visit("features");
    sectionDwell.features = rand(8000, 15000);
    t += 5000;
  }

  // final scroll depth depends on how far they got
  const maxSy = events
    .filter((e) => e.type === "scroll" && e.sy != null)
    .reduce((m, e) => Math.max(m, e.sy ?? 0), 0);
  const maxDepth = Math.min(
    100,
    Math.round(((maxSy + viewportH) / layout.sh) * 100)
  );

  sectionViews(events, visited, layout, sectionDwell);
  events.push({ t: Math.round(t), type: "session_end" });
  events.sort((a, b) => a.t - b.t);

  const clicks = events.filter((e) => e.type === "click");
  const durationMs = Math.max(8000, Math.round(t) + rand(2000, 9000));
  const engagedMs = Math.round(durationMs * rand(0.62, 0.93));
  const startedAt = new Date(
    Date.now() - rand(20 * 60_000, 46 * 60 * 60_000)
  );

  return {
    session: {
      visitorId: `seed_v${100 + index}`,
      startedAt,
      endedAt: new Date(startedAt.getTime() + durationMs),
      lastSeenAt: new Date(startedAt.getTime() + durationMs),
      durationMs,
      engagedMs,
      idleMs: Math.max(0, durationMs - engagedMs),
      clickCount: clicks.length,
      rageClicks: events.filter((e) => e.type === "rage_click").length,
      deadClicks: clicks.filter((c) => c.dead).length,
      moveCount: events.filter((e) => e.type === "mousemove").length,
      scrollCount: events.filter((e) => e.type === "scroll").length,
      keyCount: events.filter((e) => e.type === "key_press").length,
      formSubmits: events.filter((e) => e.type === "form_submit").length,
      maxScrollDepth: maxDepth,
      mouseDistance: Math.round(
        events
          .filter((e) => e.type === "mousemove")
          .reduce((acc, e) => acc + rand(60, 160), 0)
      ),
      pageHeight: layout.sh,
      viewportW,
      viewportH,
      screenWidth: deviceType === "mobile" ? 390 : 1920,
      screenHeight: deviceType === "mobile" ? 844 : 1080,
      deviceType,
      language: pick(["en-US", "en-GB", "en-US", "de-DE", "fr-FR"]),
      platform: pick(["macOS", "Windows", "Linux", "iPhone"]),
      referrer: pick([
        "",
        "https://www.google.com/",
        "https://news.ycombinator.com/",
        "https://twitter.com/",
      ]),
      userAgent: "seed/1.0 (simulated)",
      returning: Math.random() < 0.3,
      sectionTimes: JSON.stringify(sectionDwell),
      isSeed: true,
    },
    events: events.map((e) => ({
      ...e,
      t: Math.round(e.t),
      data: e.data ? JSON.stringify(e.data) : undefined,
    })),
    baseTime: startedAt.getTime(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { count?: number };
    const count = Math.max(1, Math.min(30, Number(body.count) || 12));
    for (let i = 0; i < count; i++) {
      const { session, events, baseTime } = generateSession(i);
      const created = await db.trackedSession.create({ data: session });
      const rows = events.map((e) => ({
        sessionId: created.id,
        t: e.t,
        type: e.type,
        x: e.x,
        y: e.y,
        vx: e.vx,
        vy: e.vy,
        sy: e.sy,
        sw: e.sw,
        sh: e.sh,
        targetTag: e.targetTag,
        targetId: e.targetId,
        targetText: e.targetText,
        dead: e.dead ?? false,
        rage: e.rage ?? false,
        data: e.data,
        createdAt: new Date(baseTime + e.t),
      }));
      try {
        await db.trackedEvent.createMany({ data: rows });
      } catch {
        for (const row of rows) {
          await db.trackedEvent.create({ data: row });
        }
      }
    }
    return NextResponse.json({ ok: true, seeded: count });
  } catch (err) {
    console.error("seed failed", err);
    return NextResponse.json({ error: "seed failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.trackedSession.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "clear failed" }, { status: 500 });
  }
}
