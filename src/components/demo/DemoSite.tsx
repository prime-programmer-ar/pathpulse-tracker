"use client";

// Lumina Voyages — a glassmorphism aurora-travel demo site used as tracking fodder.
// mode="live"  -> the interactive page users browse (tracked).
// mode="static" -> non-interactive render used by the heatmap & replay views.

import * as React from "react";
import {
  ArrowRight,
  Check,
  Luggage,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Telescope,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DemoSiteProps {
  mode?: "live" | "static";
  className?: string;
}

// Glass design language (glassmorphism: backdrop blur 10-20px, translucent
// surfaces 10-30% white, hairline light borders, layered depth).
const GLASS =
  "border border-white/15 bg-gradient-to-b from-white/[0.13] to-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_16px_48px_-12px_rgba(2,6,23,0.6)]";
const GLASS_SOFT = "border border-white/10 bg-white/[0.07] backdrop-blur-lg";
const GLASS_CHIP =
  "border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]";
const CTA_PRIMARY =
  "border-0 bg-gradient-to-r from-teal-400 to-violet-500 text-white font-bold shadow-lg shadow-violet-950/50 hover:from-teal-300 hover:to-violet-400";
const CTA_GLASS =
  "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white";
const FIELD_GLASS =
  "border-white/15 bg-white/5 text-white placeholder:text-white/35 backdrop-blur-md focus-visible:border-teal-300/50 focus-visible:ring-teal-300/25";

const FEATURES = [
  {
    icon: Telescope,
    title: "Dark-sky camps, not parking lots",
    text: "We hold exclusive permits on certified dark-sky land inside the auroral oval, hours from the nearest town glow, so the sky starts at your horizon.",
  },
  {
    icon: Zap,
    title: "Departures timed to solar peaks",
    text: "Windows follow the 27-day solar rotation and live KP-index forecasts. When the sun goes quiet, we shift your departure free of charge.",
  },
  {
    icon: ShieldCheck,
    title: "No-lights guarantee",
    text: "If the aurora stays away on your trip, re-book any departure within 12 months at no cost. Across five seasons, 94% of guests saw the lights.",
  },
];

const TRIPS = [
  {
    id: "iceland",
    name: "Glacier Lagoon Night",
    origin: "Vatnajökull, Iceland",
    nights: "5 nights",
    notes: "Ice caves by day, shore-side aurora camps by night. Heated glass-roof pods included.",
    price: 1890,
    badge: "Bestseller",
    art: "from-[#0f766e] via-[#0ea5e9] to-[#312e81]",
    photo: "/aurora-iceland.jpg",
  },
  {
    id: "tromso",
    name: "Fjord Lights Yacht",
    origin: "Tromsø, Norway",
    nights: "4 nights",
    notes: "A 12-guest yacht that chases clear sky up the fjord each night while you stay warm below deck.",
    price: 2240,
    badge: "Limited",
    art: "from-[#6d28d9] via-[#a855f7] to-[#ec4899]",
    photo: "/aurora-norway.jpg",
  },
  {
    id: "abisko",
    name: "Sky Station Weekend",
    origin: "Abisko, Sweden",
    nights: "3 nights",
    notes: "Chairlift straight into the rain-shadow microclimate NASA ranks #1 for clear aurora nights.",
    price: 1590,
    badge: "New",
    art: "from-[#065f46] via-[#10b981] to-[#22d3ee]",
    photo: "/aurora-sweden.jpg",
  },
];

const PLANS = [
  {
    id: "explorer",
    name: "Explorer",
    price: 19,
    per: "/month",
    bags: "1 trip credit · 12 months",
    perks: ["One expedition per year", "Swap dates freely", "Trip planner access"],
    highlight: false,
  },
  {
    id: "voyager",
    name: "Voyager",
    price: 34,
    per: "/month",
    bags: "2 trip credits · 12 months",
    perks: [
      "Two expeditions per year",
      "Solar-peak priority booking",
      "Private gear room",
      "Photography coach",
    ],
    highlight: true,
  },
  {
    id: "luminary",
    name: "Luminary",
    price: 59,
    per: "/month",
    bags: "3 trip credits · 12 months",
    perks: [
      "Everything in Voyager",
      "Expedition leader calls",
      "First pick of new trips",
      "Bring a friend free",
    ],
    highlight: false,
  },
];

const REVIEWS = [
  {
    name: "Maya K.",
    quote:
      "The yacht moved three times in one night hunting clear sky. At 1am the whole fjord turned green and nobody spoke for a solid minute. Worth every krone.",
    stars: 5,
  },
  {
    name: "Daniel R.",
    quote:
      "They rebooked us onto a KP 6 storm night for free when our first window looked cloudy. These guides read space weather like surfers read waves.",
    stars: 5,
  },
  {
    name: "Priya S.",
    quote:
      "Minus 24, and I was somehow never cold — the kit list they send is perfect. I got the photograph of my life on night two.",
    stars: 4,
  },
];

const FAQS = [
  {
    q: "When does the next expedition leave?",
    a: "Windows run from late August to early April, with peak departures between October and February. Every member sees the live departure calendar before booking, and new windows open on the first Monday of each month based on the latest solar forecast.",
  },
  {
    q: "What if the forecast turns bad?",
    a: "Guides watch cloud and KP data up to 48 hours out. If your window collapses, we move you to the next clear-sky departure at no cost, or bank your credit for the rest of the season. You never lose money to weather.",
  },
  {
    q: "How cold is it, really?",
    a: "Most nights sit between minus 10 and minus 25 Celsius, but you are never far from a heated pod or fire. We ship a personal kit list (boots, layers, batteries) six weeks before departure, and nobody who followed it has ever been cold.",
  },
  {
    q: "Do I need photography gear?",
    a: "No. Every expedition carries two shared tripods and an a7S-style low-light body, and the photography coach will set it up for you. If you have your own camera, bring it — we run a 30-minute settings clinic on night one.",
  },
  {
    q: "What fitness level is required?",
    a: "If you can walk 3 km over gentle snow, you are ready. Transport, sleds and heated shelters do the hard work. The only mandatory effort is staying awake — the strongest displays often land after midnight.",
  },
];

function scrollToSection(id: string) {
  const el = document.getElementById(`demo-${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function DemoSite({ mode = "live", className }: DemoSiteProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = React.useState(0);
  const staticMode = mode === "static";

  const notify = (title: string, description: string) => {
    if (staticMode) return;
    toast({ title, description, duration: 2600 });
  };

  const reserveSpot = (name: string) => {
    if (staticMode) return;
    setBookings((c) => c + 1);
    notify(
      "Spot reserved",
      `${name} is held for 48 hours (${bookings + 1} in your trip sheet).`
    );
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (staticMode) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    notify(
      "Message sent",
      `Thanks ${
        (data.get("name") as string) || "traveller"
      }, we will reply within one business day.`
    );
    form.reset();
  };

  return (
    <div
      id="tracked-site"
      data-track-root=""
      className={cn(
        "relative overflow-hidden bg-[#050914] font-sans text-white selection:bg-teal-400/30",
        staticMode ? "pointer-events-none select-none" : "",
        className
      )}
    >
      {/* Aurora background layer (glassmorphism backdrop) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050914] via-[#0a1128] to-[#060b18]" />
        <div className="pp-stars absolute inset-0 opacity-35" />
        <div className="pp-aurora-blob absolute -top-32 right-[6%] h-[480px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(32,178,170,0.30),transparent)] blur-2xl" />
        <div className="absolute top-[13%] -left-[10%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.26),transparent)] blur-2xl" />
        <div className="pp-aurora-blob absolute top-[40%] -right-[12%] h-[560px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.20),transparent)] blur-3xl" />
        <div className="absolute top-[64%] -left-[8%] h-[520px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(0,128,255,0.22),transparent)] blur-2xl" />
        <div className="absolute bottom-[-4%] right-[16%] h-[420px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)] blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* Site header (glass) */}
        <header className="border-b border-white/10 bg-white/[0.04] px-6 py-4 backdrop-blur-xl md:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 text-white shadow-lg shadow-violet-950/40">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-lg font-extrabold tracking-tight">
                  Lumina Voyages
                </p>
                <p className="text-xs text-white/55">
                  Northern lights expeditions
                </p>
              </div>
            </div>
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Demo site navigation"
            >
              {[
                ["shop", "Trips"],
                ["pricing", "Membership"],
                ["reviews", "Reviews"],
                ["faq", "FAQ"],
                ["contact", "Contact"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  data-nav={id}
                  onClick={() => scrollToSection(id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span
                data-interactive
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full",
                  GLASS_CHIP
                )}
                aria-label="Trip sheet"
              >
                <Luggage className="h-4.5 w-4.5 text-white/80" />
                {bookings > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-teal-400 to-violet-500 px-1 text-[11px] font-bold text-white">
                    {bookings}
                  </span>
                )}
              </span>
              <Button
                data-nav="pricing"
                onClick={() => scrollToSection("pricing")}
                className={cn("hidden font-semibold sm:inline-flex", CTA_PRIMARY)}
              >
                Join the club
              </Button>
            </div>
          </div>
        </header>
        {/* Hero */}
        <section
          id="demo-hero"
          data-section="hero"
          className="relative px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80",
                  GLASS_CHIP
                )}
              >
                <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                4.9 average from 1,900+ travellers
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl xl:text-6xl">
                The northern lights, from the last
                <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  {" "}
                  dark places on Earth
                </span>
                .
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">
                Eight-guest expeditions inside the auroral oval, timed to solar
                storms and led by guides who have logged 270 aurora nights.
                Cold-weather kit, cameras and midnight coffee included.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  data-nav="pricing"
                  onClick={() => scrollToSection("pricing")}
                  className={cn("h-12 px-7 text-base", CTA_PRIMARY)}
                >
                  Reserve your seat
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  data-nav="shop"
                  variant="outline"
                  onClick={() => scrollToSection("shop")}
                  className={cn("h-12 px-7 text-base font-semibold", CTA_GLASS)}
                >
                  See this season&rsquo;s trips
                </Button>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {[
                  ["8", "Guests per trip"],
                  ["270", "Aurora nights logged"],
                  ["94%", "Saw the lights"],
                ].map(([v, l]) => (
                  <div key={l} className={cn("rounded-2xl p-4", GLASS)}>
                    <dt className="text-2xl font-extrabold text-teal-300">
                      {v}
                    </dt>
                    <dd className="mt-0.5 text-xs font-medium text-white/55">
                      {l}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Glass expedition console visual */}
            <div className="relative hidden lg:block" aria-hidden>
              <div className="absolute right-4 top-2 h-40 w-52 rotate-6 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-lg" />
              <div
                className={cn(
                  "relative mx-auto w-[440px] rounded-[2.2rem] p-4",
                  GLASS
                )}
              >
                <div className="relative h-80 overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-[#0b1e3a] via-[#123a52] to-[#0d2430]">
                  {/* Real aurora photo in hero panel */}
                  <img
                    src="/aurora-iceland.jpg"
                    alt="Aurora borealis over glacier lagoon"
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                  />
                  <div className="pp-stars absolute inset-0 opacity-20" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#050a14] to-transparent" />
                  <div className="absolute -bottom-6 -left-[10%] h-20 w-[45%] rounded-t-full bg-[#050a14]" />
                  <div className="absolute -bottom-6 -right-[8%] h-24 w-[55%] rounded-t-full bg-[#04080f]" />
                  <span
                    className={cn(
                      "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold text-white/85",
                      GLASS_CHIP
                    )}
                  >
                    KP 6.7 · storm
                  </span>
                  <span
                    className={cn(
                      "absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold text-white/85",
                      GLASS_CHIP
                    )}
                  >
                    −18°C
                  </span>
                  <div
                    className={cn(
                      "absolute bottom-5 left-1/2 w-max -translate-x-1/2 rounded-2xl px-4 py-2 text-center",
                      GLASS_CHIP
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                      Next departure
                    </p>
                    <p className="text-sm font-extrabold text-white">
                      Glacier Lagoon · 14 Nov
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["Cloud 4%", "Wind 6 km/h", "Moon 12%"].map((m) => (
                    <div
                      key={m}
                      className={cn(
                        "rounded-xl px-2 py-2.5 text-center text-xs font-semibold text-white/75",
                        GLASS_SOFT
                      )}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features */}
        <section
          id="demo-features"
          data-section="features"
          className="border-y border-white/[0.07] bg-white/[0.03] px-6 py-16 md:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
              Why travellers rebook
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-white/60">
              We obsess over the boring details — permits, forecasts, kit — so
              your only job is to look up.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className={cn("rounded-3xl p-7", GLASS)}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-teal-400/25 to-violet-500/25 text-teal-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
                    <f.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-white/60">{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trips / shop */}
        <section
          id="demo-shop"
          data-section="shop"
          className="px-6 py-16 md:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  This season&rsquo;s expeditions
                </h2>
                <p className="mt-2 text-white/60">
                  Three windows, eight guests each. Guides confirmed for the
                  season.
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold text-white/75",
                  GLASS_CHIP
                )}
              >
                Updated with every forecast
              </span>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TRIPS.map((trip) => (
                <article
                  key={trip.id}
                  className={cn(
                    "group overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-16px_rgba(45,212,191,0.25)]",
                    GLASS
                  )}
                >
                  <div
                    className={cn(
                      "relative h-52 overflow-hidden bg-gradient-to-br",
                      trip.art
                    )}
                  >
                    {/* Real photo */}
                    <img
                      src={trip.photo}
                      alt={trip.name}
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pp-stars absolute inset-0 opacity-20" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                    <span
                      className={cn(
                        "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white",
                        GLASS_CHIP
                      )}
                    >
                      {trip.badge}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {trip.name}
                      </h3>
                      <p className="text-lg font-extrabold text-teal-300">
                        ${trip.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white/45">
                      {trip.origin} · {trip.nights}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      {trip.notes}
                    </p>
                    <Button
                      onClick={() => reserveSpot(trip.name)}
                      className={cn("mt-5 w-full font-semibold", CTA_PRIMARY)}
                    >
                      <Luggage className="mr-2 h-4 w-4" />
                      Reserve spot
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        {/* Membership / pricing */}
        <section
          id="demo-pricing"
          data-section="pricing"
          className="border-y border-white/[0.07] bg-white/[0.03] px-6 py-16 md:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
              Pick your membership
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-white/60">
              Credits never expire while your membership runs. Pause or cancel
              from your account in two clicks.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.id}
                  data-plan={plan.id}
                  className={cn(
                    "relative rounded-3xl p-7",
                    plan.highlight
                      ? "border border-teal-300/40 bg-gradient-to-b from-white/[0.16] to-white/[0.07] shadow-[0_0_48px_-10px_rgba(45,212,191,0.45),inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-xl md:-mt-4 md:mb-4"
                      : GLASS
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-950/50">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-white/50">{plan.bags}</p>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      ${plan.price}
                    </span>
                    <span className="text-sm font-medium text-white/50">
                      {plan.per}
                    </span>
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2 text-sm text-white/70"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() =>
                      notify(
                        `${plan.name} selected`,
                        "Checkout is not part of this demo, but your click was recorded."
                      )
                    }
                    className={cn(
                      "mt-6 w-full font-semibold",
                      plan.highlight ? CTA_PRIMARY : CTA_GLASS
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    Choose {plan.name}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section
          id="demo-reviews"
          data-section="reviews"
          className="px-6 py-16 md:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
              Travellers, unfiltered
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {REVIEWS.map((r) => (
                <figure key={r.name} className={cn("rounded-3xl p-7", GLASS)}>
                  <div
                    className="flex gap-1"
                    aria-label={`${r.stars} of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < r.stars
                            ? "fill-amber-300 text-amber-300"
                            : "text-white/20"
                        )}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 leading-relaxed text-white/75">
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-sm font-bold text-white">
                    {r.name}
                    <span className="ml-2 font-medium text-white/45">
                      Member since 2023
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
        {/* FAQ */}
        <section
          id="demo-faq"
          data-section="faq"
          className="border-y border-white/[0.07] bg-white/[0.03] px-6 py-16 md:px-10"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
              Questions, answered
            </h2>
            <div
              className={cn(
                "mt-8 rounded-3xl px-6 backdrop-blur-xl",
                GLASS_SOFT
              )}
            >
              <Accordion type="single" collapsible>
                {FAQS.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-white/10"
                  >
                    <AccordionTrigger className="text-left text-base font-semibold text-white hover:text-teal-200 hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-white/60">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section
          id="demo-contact"
          data-section="contact"
          className="px-6 py-16 md:px-10"
        >
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                Talk to a human
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-white/60">
                Booking questions, private-group requests, press, or just
                aurora chat. Guides answer everything within one business day
                — usually faster around a solar storm.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  [MapPin, "Base camp", "Storgata 41, Tromsø, Norway"],
                  [Mail, "Email", "hello@luminavoyages.demo"],
                  [Phone, "Phone", "+47 555 018 221"],
                ].map(([Icon, label, value]) => {
                  const I = Icon as typeof MapPin;
                  return (
                    <li
                      key={label as string}
                      className="flex items-center gap-4"
                    >
                      <span
                        className={cn(
                          "grid h-11 w-11 place-items-center rounded-xl text-teal-300",
                          GLASS_CHIP
                        )}
                      >
                        <I className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                          {label as string}
                        </p>
                        <p className="font-semibold text-white/90">
                          {value as string}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <form
              id="contact-form"
              onSubmit={onSubmit}
              className={cn("rounded-3xl p-7", GLASS)}
              noValidate={false}
            >
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name" className="text-white/80">
                    Your name
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    placeholder="Alex Rivera"
                    autoComplete="name"
                    required
                    className={FIELD_GLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email" className="text-white/80">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="alex@example.com"
                    autoComplete="email"
                    required
                    className={FIELD_GLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-message" className="text-white/80">
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Where do you want to see the lights?"
                    rows={4}
                    className={FIELD_GLASS}
                  />
                </div>
                <Button
                  type="submit"
                  className={cn("font-bold", CTA_PRIMARY)}
                >
                  Send message
                </Button>
                <p className="text-xs text-white/40">
                  This form is part of the demo. Submissions are simulated and
                  tracked as form events only.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/30 px-6 py-12 text-white/60 backdrop-blur-xl md:px-10">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 text-white shadow-lg shadow-violet-950/40">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-lg font-extrabold text-white">
                  Lumina Voyages
                </p>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">
                A fictional glassmorphism storefront built to demonstrate the
                PathPulse behaviour tracker. Every click here is being
                recorded.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white">
                Explore
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["shop", "Trips"],
                  ["pricing", "Membership"],
                  ["reviews", "Reviews"],
                  ["faq", "FAQ"],
                ].map(([id, label]) => (
                  <li key={id}>
                    <button
                      type="button"
                      data-nav={id}
                      onClick={() => scrollToSection(id)}
                      className="transition hover:text-white"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white">
                Fine print
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                No real bookings are processed. No payment data is collected.
                Interaction events are anonymous and contain no personal
                information.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
