"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowLeftRight, Search, Sparkles, Star, Users, MapPin,
  ShieldCheck, HeartHandshake, Zap, GraduationCap, Quote,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { iconFor } from "@/lib/icons";
import { cn, formatCompact } from "@/lib/utils";
import { Logo } from "../layout/app-shell";
import { Avatar, Badge } from "../ui";
import { ThemeToggle } from "../theme";
import type { Skill } from "@/types";

export function LandingPage({ skills, teachCounts }: { skills: Skill[]; teachCounts: Map<string, number> }) {
  const reduceMotion = useReducedMotion();

  const fade = {
    initial: reduceMotion ? undefined : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <Hero />
      <Stats />
      <HowItWorks fade={fade} />
      <LearnSomething skills={skills} teachCounts={teachCounts} fade={fade} />
      <Trust fade={fade} />
      <Testimonials fade={fade} />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-40 transition-all duration-300", scrolled ? "border-b border-border bg-background/85 backdrop-blur-lg" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex" aria-label="Landing">
          <a href="#how-it-works" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-foreground">How it works</a>
          <a href="#skills" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-foreground">Skills</a>
          <a href="#trust" className="rounded-lg px-3 py-2 transition-colors hover:bg-secondary hover:text-foreground">Why SkillSwap</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:block">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-lift"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-40">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-100px] h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="border border-primary/20 bg-primary/5 px-3 py-1 text-xs">
              <Sparkles size={12} /> Peer-to-peer skill exchange
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your skills are <span className="text-primary">worth something</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Teach what you know. Learn what you love. Exchange skills with people who can help you grow — using Skill Credits instead of cash.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href="/register"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-lift transition-all hover:bg-primary/90 hover:shadow-glow sm:w-auto"
            >
              Start Swapping
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#skills"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-7 text-base font-bold text-foreground transition-all hover:border-foreground/25 hover:shadow-soft sm:w-auto"
            >
              Explore Skills
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start"
          >
            <div className="flex -space-x-2">
              {["meera-krishnan", "rohan-mehta", "isabella-rossi", "aarav-sharma", "priya-patel"].map((u) => (
                <Avatar key={u} src={`/avatars/${u}.svg`} name="Member" size="sm" ring />
              ))}
            </div>
            <span>
              Trusted by <span className="font-bold text-foreground">12,000+</span> curious learners
            </span>
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md"
      aria-label="Example skill exchange: Sumit teaches QGIS, Priya teaches Python"
    >
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-lift backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <SwapCard
            emoji="🗺️"
            title="You teach"
            skill="QGIS"
            detail="Advanced · 7 yrs experience"
            accent="bg-emerald-500/10 text-emerald-600"
          />
          <SwapCard
            emoji="🐍"
            title="You learn"
            skill="Python"
            detail="Beginner · just starting"
            accent="bg-sky-500/10 text-sky-600"
          />
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <motion.div
            className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 border-t-2 border-dashed border-primary/30"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 18 }}
            className="relative z-10 flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary shadow-soft backdrop-blur"
          >
            <ArrowLeftRight size={15} className={cn(reduceMotion ? "" : "animate-pulse")} aria-hidden />
            1 Skill Credit
          </motion.div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
            <Zap size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">Perfect two-way exchange</p>
            <p className="truncate text-xs text-muted-foreground">You teach QGIS ↔ they teach Python. 98% match.</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">98%</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="absolute -left-4 -top-4 hidden rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-lift sm:block"
      >
        <p className="text-[11px] font-semibold text-muted-foreground">Swap confirmed 🎉</p>
        <p className="text-xs font-bold">Tuesday · 7:00 PM IST</p>
      </motion.div>
    </motion.div>
  );
}

function SwapCard({ emoji, title, skill, detail, accent }: { emoji: string; title: string; skill: string; detail: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.45 }}
      className="flex-1 rounded-2xl border border-border bg-background p-4"
    >
      <div className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-lg", accent)} aria-hidden>
        {emoji}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="font-display text-lg font-extrabold">{skill}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </motion.div>
  );
}

function Stats() {
  const stats = [
    { value: "12,000+", label: "Learners", icon: <Users size={18} /> },
    { value: "8,500+", label: "Skill exchanges", icon: <ArrowLeftRight size={18} /> },
    { value: "4.9/5", label: "Average rating", icon: <Star size={18} /> },
    { value: "1,200+", label: "Skills available", icon: <GraduationCap size={18} /> },
  ];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">{s.icon}</span>
            <div>
              <p className="font-display text-xl font-extrabold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ fade }: { fade: object }) {
  const steps = [
    { n: "01", title: "Share your skills", body: "Tell the community what you can teach — QGIS, guitar, SQL, yoga, anything you know well.", icon: <GraduationCap size={22} /> },
    { n: "02", title: "Find your match", body: "Discover people who teach exactly what you want to learn, scored by our compatibility engine.", icon: <Search size={22} /> },
    { n: "03", title: "Swap & grow", body: "Exchange an hour of your time and knowledge for an hour of theirs. Earn and spend Skill Credits along the way.", icon: <HeartHandshake size={22} /> },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <motion.div {...fade} className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">How it works</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Three simple steps</h2>
        <p className="mt-3 text-muted-foreground">No money changes hands. Just time, knowledge, and a little mutual generosity.</p>
      </motion.div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="group relative rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">{s.icon}</span>
              <span className="font-display text-4xl font-extrabold text-muted/60">{s.n}</span>
            </div>
            <h3 className="font-display mt-5 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LearnSomething({ skills, teachCounts, fade }: { skills: Skill[]; teachCounts: Map<string, number>; fade: object }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("ALL");
  const q = query.trim().toLowerCase();

  const visible = skills.filter((s) => {
    if (category !== "ALL" && s.category !== category) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.slug.includes(q)) return false;
    return true;
  });

  return (
    <section id="skills" className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <motion.div {...fade} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Skill discovery</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What do you want to learn?</h2>
          <p className="mt-3 text-muted-foreground">Browse skills, see who teaches them, and find your swap partner.</p>
        </motion.div>

        <motion.div {...fade} className="relative mx-auto mt-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a skill…"
            aria-label="Search for a skill"
            className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm shadow-soft transition-all placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </motion.div>

        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
          <CategoryPill active={category === "ALL"} onClick={() => setCategory("ALL")}>All</CategoryPill>
          {CATEGORIES.map((c) => (
            <CategoryPill key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
              {CATEGORY_LABEL[c.key]}
            </CategoryPill>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.slice(0, 16).map((s, i) => {
            const Icon = iconFor(s.icon);
            const teachers = teachCounts.get(s.id) ?? 0;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
              >
                <Link
                  href={`/skills/${s.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
                >
                  <span className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft transition-transform group-hover:scale-110", s.color ?? "bg-primary")}>
                    <Icon size={19} />
                  </span>
                  <h3 className="font-display text-[15px] font-bold leading-tight">{s.name}</h3>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[s.category] ?? s.category}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users size={12} /> {teachers ? `${formatCompact(teachers)} teaching` : "New"}</span>
                    <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {s.popularity > 80 ? "4.8" : "4.6"}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        {visible.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No skills match "{query}". <Link href="/skills" className="font-semibold text-primary hover:underline">Browse everything →</Link>
          </p>
        )}
      </div>
    </section>
  );
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all",
        active ? "bg-primary text-primary-foreground shadow-soft" : "border border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Trust({ fade }: { fade: object }) {
  const points = [
    { icon: <ShieldCheck size={19} />, title: "Safety first", body: "Verified profiles, user reports, blocking and dispute resolution — we take trust seriously." },
    { icon: <Star size={19} />, title: "Reputation that matters", body: "Every session ends with a review. Great teachers rise to the top of every search." },
    { icon: <Sparkles size={19} />, title: "Smarter matching", body: "Our compatibility engine weighs skills, availability, languages and time zones." },
  ];
  return (
    <section id="trust" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <motion.div {...fade} className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Why SkillSwap</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built like a marketplace, feels like a community</h2>
      </motion.div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {points.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-3xl border border-border bg-card p-7 shadow-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{p.icon}</span>
            <h3 className="font-display mt-4 text-lg font-bold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ fade }: { fade: object }) {
  const items = [
    { name: "Meera Krishnan", role: "Analytics lead · Bengaluru", quote: "I learned QGIS from Sumit and taught him SQL in return. Two hours, two new skills, zero money. This app is magic.", avatar: "/avatars/meera-krishnan.svg" },
    { name: "Rohan Mehta", role: "Frontend engineer", quote: "I teach React three nights a week and trade credits for guitar lessons. My code and my chord changes both got better.", avatar: "/avatars/rohan-mehta.svg" },
    { name: "Isabella Rossi", role: "Product designer · London", quote: "Found a Spanish coach, a yoga teacher and a whole community of curious people. SkillSwap feels like the internet's friendly corner.", avatar: "/avatars/isabella-rossi.svg" },
  ];
  return (
    <section className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Member stories</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Loved by people who never stop learning</h2>
        </motion.div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-soft"
            >
              <Quote className="mb-4 h-6 w-6 text-primary/40" aria-hidden />
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar src={t.avatar} name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-lift sm:px-12 sm:py-20"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
        </div>
        <div className="relative">
          <h2 className="font-display mx-auto max-w-xl text-balance text-3xl font-extrabold leading-tight sm:text-4xl">
            Teach one hour. Learn one hour. Repeat.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/85">
            Join thousands of people turning what they know into what they want to learn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-background px-8 text-base font-bold text-primary shadow-lift transition-transform hover:scale-[1.03]"
            >
              Start Swapping <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center px-6 text-base font-bold text-primary-foreground/90 underline-offset-4 hover:underline">
              I already have an account
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-primary-foreground/75">
            <MapPin size={13} /> 25 cities · 120+ skills · free to join
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function LandingFooter() {
  const links: { label: string; href: string }[][] = [
    [
      { label: "How it works", href: "#how-it-works" },
      { label: "Explore skills", href: "#skills" },
      { label: "Discover people", href: "/discover" },
    ],
    [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Community Guidelines", href: "/guidelines" },
      { label: "Safety Center", href: "/safety" },
    ],
  ];
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A peer-to-peer marketplace where your skills are worth something. Teach what you know. Learn what you love.
          </p>
        </div>
        <div className="flex gap-14">
          {links.map((group, gi) => (
            <nav key={gi} aria-label="Footer links" className="flex flex-col gap-2.5">
              {group.map((l) => (
                <Link key={l.label} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} SkillSwap. Made with 💜 for curious people.</p>
          <p>Your skills are worth something.</p>
        </div>
      </div>
    </footer>
  );
}
