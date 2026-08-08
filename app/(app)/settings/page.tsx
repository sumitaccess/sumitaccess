"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Save, Upload, UserRound, GraduationCap, BookOpen, Lock, X, Check, ImageIcon, LogOut, ShieldQuestion } from "lucide-react";
import { get, patch, post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { Avatar, Badge, Button, Card, Field, Input, Select, Textarea, Skeleton } from "@/components/ui";
import { SkillChip } from "@/components/shared";
import { SKILL_LEVELS, SKILL_LEVEL_LABEL, AVAILABILITY_PRESETS, TIMEZONES, ONLINE_PREFS, CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Skill, UserSkill } from "@/types";


export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<{
    name: string; username: string; email: string; image: string | null; headline: string | null; bio: string | null;
    location: string | null; timezone: string; languages: string; onlinePref: string; availability: string | null;
  } | null>(null);
  const [skills, setSkills] = React.useState<{ teach: (UserSkill & { skill: Skill })[]; learn: (UserSkill & { skill: Skill })[] } | null>(null);
  const [catalogue, setCatalogue] = React.useState<Skill[]>([]);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingSkills, setSavingSkills] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    get<{ user: typeof profile; skills: { teach: (UserSkill & { skill: Skill })[]; learn: (UserSkill & { skill: Skill })[] } }>("/api/me")
      .then((res) => {
        setProfile(res.user);
        setSkills(res.skills);
      })
      .catch(() => {});
    get<{ skills: Skill[] }>("/api/skills").then((res) => setCatalogue(res.skills)).catch(() => {});
  }, []);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await post<{ url: string }>("/api/upload", { dataUrl, kind: "avatar" });
      setProfile((p) => (p ? { ...p, image: res.url } : p));
    } catch {
      toastError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      await patch("/api/me", {
        name: profile.name,
        username: profile.username,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        timezone: profile.timezone,
        languages: profile.languages,
        onlinePref: profile.onlinePref,
        image: profile.image,
        availability: profile.availability ? JSON.parse(profile.availability) : undefined,
      });
      toastSuccess("Profile saved ✓");
      router.refresh();
    } catch (err) {
      toastError("Couldn't save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSkills = async () => {
    if (!skills) return;
    setSavingSkills(true);
    try {
      await post("/api/me/skills", {
        teach: skills.teach.map((s) => ({ skillId: s.skillId, level: s.level })),
        learn: skills.learn.map((s) => ({ skillId: s.skillId, level: s.level })),
      });
      toastSuccess("Skills updated ✓");
      router.refresh();
    } catch (err) {
      toastError("Couldn't save skills", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSavingSkills(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Make your profile work harder for your swaps.</p>
      </div>

      {!profile || !skills ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <>
      {/* Profile */}
      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound size={15} /></span>
          Profile information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile.image} name={profile.name} size="lg" />
            <div>
              <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => document.getElementById("settings-avatar")?.click()}>
                <Upload size={14} /> Change photo
              </Button>
              <input id="settings-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(f); e.target.value = ""; }} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={profile.email} disabled className="opacity-60" />
            </Field>
            <Field label="Headline" hint="Shows under your name">
              <Input value={profile.headline ?? ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} maxLength={80} placeholder="GIS Specialist · Remote Sensing & QGIS" />
            </Field>
          </div>
          <Field label="Bio">
            <Textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} maxLength={400} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City">
              <Input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Delhi, India" />
            </Field>
            <Field label="Timezone">
              <Select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
            </Field>
            <Field label="Languages" hint="Comma separated">
              <Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="English, Hindi" />
            </Field>
          </div>
          <Field label="Session preference">
            <div className="flex gap-2">
              {ONLINE_PREFS.map((p) => (
                <button key={p} onClick={() => setProfile({ ...profile, onlinePref: p })} aria-pressed={profile.onlinePref === p} className={cn("rounded-full border px-4 py-2 text-xs font-bold transition-all", profile.onlinePref === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/25")}>
                  {p === "ONLINE" ? "Online" : p === "IN_PERSON" ? "In-person" : "Both"}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={savingProfile}><Save size={15} /> Save profile</Button>
          </div>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><GraduationCap size={15} /></span>
          Skills
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">Pick what you teach and what you want to learn. These drive your matches.</p>
        <div className="space-y-5">
          <SkillSection
            label="I can teach"
            accent="emerald"
            icon={<GraduationCap size={14} />}
            picked={skills.teach}
            catalogue={catalogue}
            onChange={(next) => setSkills({ ...skills, teach: next })}
          />
          <SkillSection
            label="I want to learn"
            accent="sky"
            icon={<BookOpen size={14} />}
            picked={skills.learn}
            catalogue={catalogue}
            onChange={(next) => setSkills({ ...skills, learn: next })}
          />
          <div className="flex justify-end">
            <Button onClick={saveSkills} loading={savingSkills}><Save size={15} /> Save skills</Button>
          </div>
        </div>
      </Card>

      {/* Availability */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold">🕐 Availability</h2>
        <p className="mb-5 text-sm text-muted-foreground">Your weekly rhythm — used to find compatible session times.</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {AVAILABILITY_PRESETS.map((a) => {
            const active = profile.availability ? JSON.stringify(JSON.parse(profile.availability)) === JSON.stringify(a.value) : false;
            return (
              <button
                key={a.key}
                onClick={() => {
                  setProfile({ ...profile, availability: JSON.stringify(a.value) });
                  toastSuccess(`Availability set to "${a.label}"`);
                }}
                aria-pressed={active}
                className={cn("flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-bold transition-all", active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-foreground/25")}
              >
                {a.label}
                {active && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
        </div>
        {profile.availability && (
          <button
            onClick={() => { setProfile({ ...profile, availability: null }); }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <X size={12} /> Clear availability (show as flexible)
          </button>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={saveProfile} loading={savingProfile}><Save size={15} /> Save availability</Button>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><Lock size={15} /></span>
          Security
        </h2>
        <PasswordChange />
      </Card>

      {/* Danger zone */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500"><ShieldQuestion size={15} /></span>
          Account
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">Found something off? Let us know — reports are confidential.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" href="/safety">Visit Safety Center</Button>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

function SkillSection({ label, picked, catalogue, onChange, accent, icon }: { label: string; picked: (UserSkill & { skill: Skill })[]; catalogue: Skill[]; onChange: (v: (UserSkill & { skill: Skill })[]) => void; accent: "emerald" | "sky"; icon: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const visible = catalogue.filter((s) => !q || s.name.toLowerCase().includes(q));

  const toggle = (skill: Skill) => {
    if (picked.some((p) => p.skill.id === skill.id)) {
      onChange(picked.filter((p) => p.skill.id !== skill.id));
    } else if (picked.length < 8) {
      onChange([...picked, { id: `${skill.id}-new`, userId: "", skillId: skill.id, type: label.startsWith("I can") ? "TEACH" : "LEARN", level: "INTERMEDIATE", yearsExperience: 0, description: null, skill }]);
    }
  };

  const setLevel = (skillId: string, level: string) => {
    onChange(picked.map((p) => (p.skill.id === skillId ? { ...p, level } : p)));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400")}>
          {icon} {label}
        </p>
        <Badge variant="secondary">{picked.length}/8</Badge>
      </div>
      <div className="relative mb-3">
        <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add a skill…" className="pl-10" />
      </div>
      {picked.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {picked.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-1 py-1 pl-2.5">
              <SkillChip skill={p.skill} size="xs" />
              <select value={p.level} onChange={(e) => setLevel(p.skill.id, e.target.value)} aria-label={`${p.skill.name} level`} className="cursor-pointer rounded-full border-0 bg-transparent text-[10px] font-bold text-muted-foreground outline-none">
                {SKILL_LEVELS.map((l) => <option key={l} value={l}>{SKILL_LEVEL_LABEL[l]}</option>)}
              </select>
              <button onClick={() => toggle(p.skill)} aria-label={`Remove ${p.skill.name}`} className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-destructive">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {visible.filter((s) => !picked.some((p) => p.skill.id === s.id)).slice(0, 20).map((s) => {
          const Icon = iconFor(s.icon);
          return (
            <button key={s.id} onClick={() => toggle(s)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-all hover:border-primary/40 hover:bg-accent">
              <Icon size={13} className={s.color ?? ""} />
              {s.name}
            </button>
          );
        })}
      </div>
      {visible.length === 0 && <p className="text-xs text-muted-foreground">No skills match "{query}".</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">Suggest a new skill via the admin if it's missing — or just pick something close.</p>
    </div>
  );
}

function PasswordChange() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (next.length < 8) return toastError("Password too short", "Use at least 8 characters.");
    if (next !== confirm) return toastError("Passwords don't match");
    setSaving(true);
    try {
      await post("/api/me/password", { currentPassword: current, newPassword: next });
      toastSuccess("Password updated ✓");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toastError("Couldn't update password", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Current password">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="New password">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </Field>
      <div className="flex items-end gap-2">
        <Field label="Confirm">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button size="icon" onClick={submit} loading={saving} aria-label="Update password"><Lock size={15} /></Button>
      </div>
    </div>
  );
}
