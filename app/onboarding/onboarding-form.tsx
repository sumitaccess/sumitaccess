"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, MapPin, Upload, X, GraduationCap, BookOpen, CalendarClock, UserRound, ImageIcon } from "lucide-react";
import { get, post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { Avatar, Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { SKILL_LEVELS, AVAILABILITY_PRESETS, TIMEZONES, ONLINE_PREFS, SKILL_LEVEL_LABEL } from "@/lib/constants";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Skill } from "@/types";

interface PickedSkill {
  skill: Skill;
  level: string;
}

const STEPS = [
  { key: "teach", title: "What can you teach?", subtitle: "Pick 1–5 skills you're great at. Be generous — someone needs them.", icon: <GraduationCap size={18} /> },
  { key: "learn", title: "What do you want to learn?", subtitle: "Pick the skills you'd love to gain. Matches work both ways.", icon: <BookOpen size={18} /> },
  { key: "level", title: "How experienced are you?", subtitle: "Tell us where you are, so matches fit your level.", icon: <Sparkles size={18} /> },
  { key: "availability", title: "When are you usually available?", subtitle: "Your weekly rhythm — matches use this to find compatible times.", icon: <CalendarClock size={18} /> },
  { key: "location", title: "Where are you located?", subtitle: "City + timezone helps us suggest the right sessions.", icon: <MapPin size={18} /> },
  { key: "profile", title: "Say hello", subtitle: "A photo and a line about you make swaps feel human.", icon: <UserRound size={18} /> },
];

const LEVELS = SKILL_LEVELS.map((l) => ({
  key: l,
  label: SKILL_LEVEL_LABEL[l],
  desc: l === "BEGINNER" ? "New to this skill" : l === "INTERMEDIATE" ? "Comfortable, building fluency" : l === "ADVANCED" ? "Strong, could teach basics" : "Deep expertise",
}));

export function OnboardingForm({ initialSkills }: { initialSkills: Skill[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  const [teach, setTeach] = React.useState<PickedSkill[]>([]);
  const [learn, setLearn] = React.useState<PickedSkill[]>([]);
  const [level, setLevel] = React.useState("INTERMEDIATE");
  const [availKey, setAvailKey] = React.useState<string>("weekdays-evenings");
  const [customAvail, setCustomAvail] = React.useState<string>("");
  const [location, setLocation] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [onlinePref, setOnlinePref] = React.useState<string>("ONLINE");
  const [headline, setHeadline] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [image, setImage] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const pickers = [teach, learn];
  const setters = [setTeach, setLearn];

  const toggleSkill = (skill: Skill, list: PickedSkill[], set: (v: PickedSkill[]) => void) => {
    if (list.some((p) => p.skill.id === skill.id)) {
      set(list.filter((p) => p.skill.id !== skill.id));
    } else if (list.length < 5) {
      set([...list, { skill, level: "INTERMEDIATE" }]);
    }
  };

  const setPickLevel = (skillId: string, lvl: string, list: PickedSkill[], set: (v: PickedSkill[]) => void) => {
    set(list.map((p) => (p.skill.id === skillId ? { ...p, level: lvl } : p)));
  };

  const canContinue = () => {
    if (step === 0) return teach.length > 0;
    if (step === 1) return learn.length > 0;
    if (step === 3) return Boolean(availKey) || customAvail.trim().length > 0;
    if (step === 4) return location.trim().length > 0;
    if (step === 5) return bio.trim().length >= 10;
    return true;
  };

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toastError("Please choose an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toastError("Image too large", "Max 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await post<{ url: string }>("/api/upload", { dataUrl, kind: "avatar" });
      setImage(res.url);
    } catch {
      toastError("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await post("/api/onboarding", {
        teach: teach.map((p) => ({ skillId: p.skill.id, level: p.level })),
        learn: learn.map((p) => ({ skillId: p.skill.id, level: p.level })),
        availability: availKey ? AVAILABILITY_PRESETS.find((a) => a.key === availKey)!.value : parseCustomAvail(customAvail),
        location,
        timezone,
        onlinePref,
        headline: headline.trim() || null,
        bio: bio.trim(),
        image,
        languages: "English",
      });
      toastSuccess("You're ready to start swapping 🎉", "We found your matches — go say hi.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toastError("Couldn't finish setup", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="text-primary">Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step].title}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">{STEPS[step].icon}</span>
              <div>
                <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{STEPS[step].title}</h1>
                <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
              </div>
            </div>

            <div className="mt-6">
              {step === 0 && <SkillPicker picked={teach} onToggle={(s) => toggleSkill(s, teach, setTeach)} onLevel={(id, l) => setPickLevel(id, l, teach, setTeach)} skills={initialSkills} />}
              {step === 1 && <SkillPicker picked={learn} onToggle={(s) => toggleSkill(s, learn, setLearn)} onLevel={(id, l) => setPickLevel(id, l, learn, setLearn)} skills={initialSkills} />}

              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.key}
                      onClick={() => setLevel(l.key)}
                      aria-pressed={level === l.key}
                      className={cn(
                        "rounded-2xl border p-5 text-left transition-all",
                        level === l.key ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-foreground/25 hover:shadow-soft",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-bold">{l.label}</span>
                        {level === l.key && <Check size={17} className="text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {AVAILABILITY_PRESETS.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => {
                          setAvailKey(a.key);
                          setCustomAvail("");
                        }}
                        aria-pressed={availKey === a.key}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-all",
                          availKey === a.key ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-foreground/25",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{a.label}</span>
                          {availKey === a.key && <Check size={16} className="text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <Field label="…or describe your availability" hint="e.g. Mondays & Wednesdays 6–8 PM">
                    <Textarea value={customAvail} onChange={(e) => { setCustomAvail(e.target.value); setAvailKey(""); }} placeholder="I'm free weekday evenings after 6pm, and Saturday mornings…" />
                  </Field>
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold">Session preference</p>
                    <div className="flex gap-2">
                      {ONLINE_PREFS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setOnlinePref(p)}
                          aria-pressed={onlinePref === p}
                          className={cn(
                            "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                            onlinePref === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/25",
                          )}
                        >
                          {p === "ONLINE" ? "Online" : p === "IN_PERSON" ? "In-person" : "Both"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" htmlFor="location">
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" />
                  </Field>
                  <Field label="Timezone" htmlFor="timezone">
                    <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar src={image} name="You" size="xl" />
                      {image && (
                        <button
                          onClick={() => setImage(null)}
                          aria-label="Remove photo"
                          className="absolute -right-1 -top-1 rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => document.getElementById("avatar-upload")?.click()}>
                        <Upload size={14} /> {image ? "Change photo" : "Upload a photo"}
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void onUpload(f);
                          e.target.value = "";
                        }}
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">PNG, JPG or WebP · max 4 MB</p>
                    </div>
                  </div>
                  <Field label="Headline" hint="One line that describes what you do">
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="GIS Specialist · Remote Sensing & QGIS" maxLength={80} />
                  </Field>
                  <Field label="Bio" hint="Tell people what you teach, what you're curious about, and how you like to learn.">
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I help teams turn spatial data into decisions — and I'm learning Python to automate the boring parts of my work." maxLength={400} rows={4} />
                  </Field>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue()}>
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button type="button" onClick={finish} loading={saving} size="lg">
              <Sparkles size={17} /> Find My Matches
            </Button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {step === 0 && `You can always edit your skills later in Settings.`}
        {step === 5 && `You'll get 3 starter Skill Credits to make your first swap.`}
      </p>
    </div>
  );
}

function SkillPicker({ skills, picked, onToggle, onLevel }: { skills: Skill[]; picked: PickedSkill[]; onToggle: (s: Skill) => void; onLevel: (skillId: string, level: string) => void }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const visible = skills.filter((s) => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));

  return (
    <div>
      <div className="relative">
        <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          aria-label="Search skills"
          className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm shadow-soft placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {visible.map((s) => {
          const p = picked.find((x) => x.skill.id === s.id);
          const Icon = iconFor(s.icon);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s)}
              aria-pressed={Boolean(p)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                p ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground/80 hover:border-primary/40 hover:bg-accent",
              )}
            >
              <Icon size={13} className={s.color ?? ""} />
              {s.name}
              {p && <Check size={12} />}
              {p && (
                <select
                  value={p.level}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onLevel(s.id, e.target.value)}
                  aria-label={`${s.name} level`}
                  className="cursor-pointer rounded-full border-0 bg-transparent px-0.5 text-[10px] font-bold text-muted-foreground outline-none"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l} value={l}>{SKILL_LEVEL_LABEL[l]}</option>
                  ))}
                </select>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {picked.length > 0 ? (
          <>
            <Badge variant="success">{picked.length} selected</Badge> — click a skill's level badge to set your level.
          </>
        ) : (
          "Select up to 5 skills."
        )}
      </p>
    </div>
  );
}

function parseCustomAvail(text: string): Record<string, string[]> {
  // Very permissive parse — free text is stored but treated as flexible.
  return text.trim() ? { custom: [text.trim().slice(0, 200)] } : {};
}
