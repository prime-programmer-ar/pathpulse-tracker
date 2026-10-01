"use client";

// Aurora Beans — a realistic demo storefront used as tracking fodder.
// mode="live"  -> the interactive page users browse (tracked).
// mode="static" -> non-interactive render used by the heatmap & replay views.

import * as React from "react";
import {
  ArrowRight,
  Check,
  Coffee,
  Leaf,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
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

const FEATURES = [
  {
    icon: Leaf,
    title: "Single origin, always fresh",
    text: "Every batch is sourced from one farm and roasted within 48 hours of shipping, so the origin character survives all the way to your cup.",
  },
  {
    icon: Truck,
    title: "Free 2-day delivery",
    text: "Orders leave our roastery every Monday and Thursday. Free shipping on every subscription box, always, with no minimum order.",
  },
  {
    icon: ShieldCheck,
    title: "Roast-proof guarantee",
    text: "If a bag does not taste spectacular, tell us within 30 days and we replace it or refund you. No forms, no questions.",
  },
];

const PRODUCTS = [
  {
    id: "sunrise",
    name: "Sunrise Blend",
    origin: "Huila, Colombia",
    notes: "Milk chocolate, red apple, caramel",
    price: 18,
    roast: "Medium",
    badge: "Bestseller",
    tone: "amber",
  },
  {
    id: "midnight",
    name: "Midnight Reserve",
    origin: "Yirgacheffe, Ethiopia",
    notes: "Blueberry, dark cocoa, jasmine",
    price: 24,
    roast: "Dark",
    badge: "Limited",
    tone: "stone",
  },
  {
    id: "meadow",
    name: "Meadow Light",
    origin: "Nyeri, Kenya",
    notes: "Blackcurrant, honey, citrus zest",
    price: 21,
    roast: "Light",
    badge: "New",
    tone: "emerald",
  },
];

const PLANS = [
  {
    id: "explorer",
    name: "Explorer",
    price: 19,
    per: "/month",
    bags: "1 bag · 250g",
    perks: ["Choose your roast", "Skip or pause anytime", "Free shipping"],
    highlight: false,
  },
  {
    id: "regular",
    name: "Regular",
    price: 34,
    per: "/month",
    bags: "2 bags · 500g",
    perks: [
      "Mix any origins",
      "Early access to limited roasts",
      "Free shipping",
      "Tasting notes card",
    ],
    highlight: true,
  },
  {
    id: "obsessed",
    name: "Obsessed",
    price: 59,
    per: "/month",
    bags: "4 bags · 1kg",
    perks: [
      "Everything in Regular",
      "Rare micro-lot every quarter",
      "Brew gear discounts",
      "Priority support",
    ],
    highlight: false,
  },
];

const REVIEWS = [
  {
    name: "Maya K.",
    quote:
      "The Midnight Reserve is the best coffee I have had at home, full stop. Tastes like a specialty cafe without leaving the kitchen.",
    stars: 5,
  },
  {
    name: "Daniel R.",
    quote:
      "Cancelled twice while travelling and restarted with one click. Support answered in five minutes. This is how subscriptions should work.",
    stars: 5,
  },
  {
    name: "Priya S.",
    quote:
      "The tasting notes are actually accurate, which is rare. My morning ritual has quietly upgraded itself.",
    stars: 4,
  },
];

const FAQS = [
  {
    q: "When does my first box ship?",
    a: "We roast on Mondays and Thursdays. Orders placed before 8am ship the same roast day and arrive within 2 days. Your first box includes a welcome card with brew guides for each origin.",
  },
  {
    q: "Can I pause or skip a delivery?",
    a: "Yes. Skip, pause, or cancel from your account in two clicks. Changes made up to 24 hours before a roast day apply to that box automatically.",
  },
  {
    q: "How fresh is the coffee, really?",
    a: "Every bag is roasted to order, sealed with a one-way valve, and stamped with the roast date. Nothing sits in a warehouse. Typical age at your door: 2 to 4 days.",
  },
  {
    q: "Do you offer decaf?",
    a: "We offer a Swiss Water processed decaf from Colombia as a swap option in any plan at no extra cost. Select it during checkout or from your account.",
  },
  {
    q: "What if I do not like a bag?",
    a: "Tell us within 30 days and we replace the bag or refund the box. You keep the coffee. The only thing we ask is what went wrong, so the roasters can adjust.",
  },
];

function scrollToSection(id: string) {
  const el = document.getElementById(`demo-${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function DemoSite({ mode = "live", className }: DemoSiteProps) {
  const { toast } = useToast();
  const [cart, setCart] = React.useState(0);
  const staticMode = mode === "static";

  const notify = (title: string, description: string) => {
    if (staticMode) return;
    toast({ title, description, duration: 2600 });
  };

  const addToCart = (name: string) => {
    if (staticMode) return;
    setCart((c) => c + 1);
    notify("Added to cart", `${name} is in your cart (${cart + 1} items).`);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (staticMode) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    notify(
      "Message sent",
      `Thanks ${
        (data.get("name") as string) || "friend"
      }, we will reply within one business day.`
    );
    form.reset();
  };

  return (
    <div
      id="tracked-site"
      data-track-root=""
      className={cn(
        "relative bg-[#faf6f0] font-sans text-[#2b1d12] selection:bg-[#f5d9a8]",
        staticMode ? "pointer-events-none select-none" : "",
        className
      )}
    >
      {/* Site header */}
      <header className="border-b border-[#e5d9c9] bg-[#faf6f0]/95 px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#b4531f] to-[#7c3413] text-white shadow-sm">
              <Coffee className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight">
                Aurora Beans
              </p>
              <p className="text-xs text-[#8a7561]">Specialty coffee club</p>
            </div>
          </div>
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Demo site navigation"
          >
            {[
              ["shop", "Shop"],
              ["pricing", "Subscriptions"],
              ["reviews", "Reviews"],
              ["faq", "FAQ"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-nav={id}
                onClick={() => scrollToSection(id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5d4a37] transition hover:bg-[#f0e5d4] hover:text-[#2b1d12]"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span
              data-interactive
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d0bb] bg-white"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5 text-[#6b543d]" />
              {cart > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#b4531f] px-1 text-[11px] font-bold text-white">
                  {cart}
                </span>
              )}
            </span>
            <Button
              data-nav="pricing"
              onClick={() => scrollToSection("pricing")}
              className="hidden bg-[#b4531f] font-semibold text-white shadow-sm hover:bg-[#9a4218] sm:inline-flex"
            >
              Start subscription
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="demo-hero"
        data-section="hero"
        className="relative overflow-hidden px-6 py-20 md:px-10 md:py-28"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#f3d9a7]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#e8b477]/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e3c58f] bg-[#fdf1da] px-3.5 py-1.5 text-xs font-semibold text-[#8a5a1d]">
              <Star className="h-3.5 w-3.5 fill-[#e8a33d] text-[#e8a33d]" />
              4.9 average from 2,300+ members
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl xl:text-6xl">
              Ridiculously fresh coffee, roasted two days before it reaches
              your door.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#6b543d]">
              Single-origin lots from farmers we actually visit, roasted to
              order in small batches, and shipped on a schedule you control.
              Pause anytime. Taste everything.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                data-nav="pricing"
                onClick={() => scrollToSection("pricing")}
                className="h-12 bg-[#b4531f] px-7 text-base font-bold text-white shadow-lg shadow-[#b4531f]/25 hover:bg-[#9a4218]"
              >
                Start your subscription
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                data-nav="shop"
                variant="outline"
                onClick={() => scrollToSection("shop")}
                className="h-12 border-[#d8c3a8] bg-white px-7 text-base font-semibold text-[#6b4a2a] hover:bg-[#faf0df]"
              >
                Browse this week's roasts
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["48h", "Roast to ship"],
                ["12", "Origin partners"],
                ["97%", "Stay past box 3"],
              ].map(([v, l]) => (
                <div
                  key={l}
                  className="rounded-2xl border border-[#eadbc4] bg-white/70 p-4"
                >
                  <dt className="text-2xl font-extrabold text-[#9a4218]">
                    {v}
                  </dt>
                  <dd className="mt-0.5 text-xs font-medium text-[#8a7561]">
                    {l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative hidden lg:block" aria-hidden>
            <div className="mx-auto grid h-[420px] w-[420px] rotate-3 place-items-center rounded-[2.5rem] bg-gradient-to-br from-[#c9702e] via-[#9a4218] to-[#5c2a0e] shadow-2xl shadow-[#7c3413]/30">
              <div className="grid h-[340px] w-[340px] -rotate-2 place-items-center rounded-[2rem] border-8 border-[#f5e6cd] bg-[#fdf8ee]">
                <div className="text-center">
                  <Coffee className="mx-auto h-16 w-16 text-[#b4531f]" />
                  <p className="mt-3 text-2xl font-extrabold tracking-tight">
                    AURORA BEANS
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#a08663]">
                    Fresh roast club
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="demo-features"
        data-section="features"
        className="border-y border-[#eadbc4] bg-[#f5eee1] px-6 py-16 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            Why members stay
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#6b543d]">
            We obsess over the boring details so your morning does not have to
            involve compromise.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-[#eadbc4] bg-white p-7 shadow-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fdf1da] text-[#b4531f]">
                  <f.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-[#6b543d]">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Shop */}
      <section
        id="demo-shop"
        data-section="shop"
        className="px-6 py-16 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                This week&apos;s roasts
              </h2>
              <p className="mt-2 text-[#6b543d]">
                Three origins, roasted Thursday. Limited stock per lot.
              </p>
            </div>
            <span className="rounded-full bg-[#f0e5d4] px-4 py-1.5 text-xs font-semibold text-[#6b543d]">
              Updated every roast day
            </span>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRODUCTS.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-[#eadbc4] bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className={cn(
                    "relative grid h-44 place-items-center",
                    p.tone === "amber" &&
                      "bg-gradient-to-br from-[#f6d9a0] to-[#e9b268]",
                    p.tone === "stone" &&
                      "bg-gradient-to-br from-[#ded3c2] to-[#b5a48d]",
                    p.tone === "emerald" &&
                      "bg-gradient-to-br from-[#cfe6c3] to-[#93c07f]"
                  )}
                >
                  <Coffee
                    className="h-14 w-14 text-[#5c4029]/70 transition-transform group-hover:scale-110"
                    aria-hidden
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6b4a2a]">
                    {p.badge}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-lg font-extrabold text-[#9a4218]">
                      ${p.price}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#a08663]">
                    {p.origin} · {p.roast} roast
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b543d]">
                    {p.notes}
                  </p>
                  <Button
                    onClick={() => addToCart(p.name)}
                    className="mt-5 w-full bg-[#2b1d12] font-semibold text-white hover:bg-[#3d2a1a]"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to cart
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="demo-pricing"
        data-section="pricing"
        className="border-y border-[#eadbc4] bg-[#f5eee1] px-6 py-16 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            Pick your rhythm
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[#6b543d]">
            Every plan ships free. Change, pause, or cancel whenever you like.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                data-plan={plan.id}
                className={cn(
                  "relative rounded-2xl border p-7",
                  plan.highlight
                    ? "border-[#b4531f] bg-white shadow-xl shadow-[#b4531f]/10 md:-mt-4 md:mb-4"
                    : "border-[#eadbc4] bg-white shadow-sm"
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#b4531f] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-[#8a7561]">{plan.bags}</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-medium text-[#8a7561]">
                    {plan.per}
                  </span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-sm text-[#5d4a37]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7c9a54]" />
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
                    plan.highlight
                      ? "bg-[#b4531f] text-white hover:bg-[#9a4218]"
                      : "border-[#d8c3a8] bg-white text-[#6b4a2a] hover:bg-[#faf0df]"
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
            Members, unfiltered
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure
                key={r.name}
                className="rounded-2xl border border-[#eadbc4] bg-white p-7 shadow-sm"
              >
                <div className="flex gap-1" aria-label={`${r.stars} of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < r.stars
                          ? "fill-[#e8a33d] text-[#e8a33d]"
                          : "text-[#e0d0bb]"
                      )}
                    />
                  ))}
                </div>
                <blockquote className="mt-4 leading-relaxed text-[#5d4a37]">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-bold">
                  {r.name}
                  <span className="ml-2 font-medium text-[#a08663]">
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
        className="border-y border-[#eadbc4] bg-[#f5eee1] px-6 py-16 md:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            Questions, answered
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-[#eadbc4]"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-[#2b1d12] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-[#6b543d]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
            <p className="mt-3 max-w-md leading-relaxed text-[#6b543d]">
              Roasting questions, subscription changes, wholesale, or just
              coffee chat. We answer everything within one business day.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                [MapPin, "Roastery", "14 Foundry Lane, Portland, OR"],
                [Mail, "Email", "hello@aurorabeans.demo"],
                [Phone, "Phone", "+1 (555) 014-9922"],
              ].map(([Icon, label, value]) => {
                const I = Icon as typeof MapPin;
                return (
                  <li key={label as string} className="flex items-center gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fdf1da] text-[#b4531f]">
                      <I className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#a08663]">
                        {label as string}
                      </p>
                      <p className="font-semibold">{value as string}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <form
            id="contact-form"
            onSubmit={onSubmit}
            className="rounded-2xl border border-[#eadbc4] bg-white p-7 shadow-sm"
            noValidate={false}
          >
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="contact-name">Your name</Label>
                <Input
                  id="contact-name"
                  name="name"
                  placeholder="Alex Rivera"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="alex@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  placeholder="How can we help?"
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="bg-[#b4531f] font-bold text-white hover:bg-[#9a4218]"
              >
                Send message
              </Button>
              <p className="text-xs text-[#a08663]">
                This form is part of the demo. Submissions are simulated and
                tracked as form events only.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2b1d12] px-6 py-12 text-[#cdb89f] md:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#b4531f] text-white">
                <Coffee className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-lg font-extrabold text-white">Aurora Beans</p>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              A fictional storefront built to demonstrate the PathPulse
              behaviour tracker. Every click here is being recorded.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["shop", "Shop"],
                ["pricing", "Subscriptions"],
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
              No real orders are processed. No payment data is collected.
              Interaction events are anonymous and contain no personal
              information.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
