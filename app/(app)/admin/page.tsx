"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, CalendarDays, Coins, Star, ShieldAlert, TrendingUp, UserPlus, Ban, RotateCcw, Plus, Trash2, Check, X, ShieldCheck } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get, post } from "@/lib/client";
import { toastError, toastSuccess } from "@/components/toasts";
import { Avatar, Badge, Button, Card, Input, Modal, Select, Skeleton, Tabs, Textarea } from "@/components/ui";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import type { SafeUser, Session, Report, Skill } from "@/types";

interface AdminData {
  metrics: {
    users: number; activeUsers: number; newThisWeek: number; suspendedUsers: number; sessions: number;
    pendingSessions: number; completedSwaps: number; creditsExchanged: number; totalReviews: number;
    avgRating: number; openReports: number; revenue: number;
    sessionsByDay: { date: string; count: number }[]; signupsByDay: { date: string; count: number }[];
    topSkills: { name: string; count: number }[];
  };
  users: SafeUser[];
  sessions: (Session & { teacherName: string; learnerName: string; skillName: string })[];
  skills: Skill[];
  reports: (Report & { reporterName: string; reportedName: string })[];
}

export default function AdminPage() {
  const [data, setData] = React.useState<AdminData | null>(null);
  const [tab, setTab] = React.useState("overview");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    get<AdminData>("/api/admin")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-display text-base font-bold">Admin access required</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with an admin account to view this page.</p>
      </div>
    );
  }
  if (!data) return <Skeleton className="h-96 rounded-2xl" />;

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={19} /></span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "users", label: "Users", count: data.users.length },
          { key: "sessions", label: "Sessions" },
          { key: "skills", label: "Skills", count: data.skills.length },
          { key: "reports", label: "Reports", count: m.openReports },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" && <Overview metrics={m} />}
      {tab === "users" && <UsersTab users={data.users} />}
      {tab === "sessions" && <SessionsTab sessions={data.sessions} />}
      {tab === "skills" && <SkillsTab skills={data.skills} />}
      {tab === "reports" && <ReportsTab reports={data.reports} />}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone ?? "bg-secondary text-muted-foreground"}`}>{icon}</span>
        <div>
          <p className="font-display text-xl font-extrabold tabular-nums">{value}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function Overview({ metrics: m }: { metrics: AdminData["metrics"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Users size={16} />} label="Total users" value={m.users} tone="bg-primary/10 text-primary" />
        <StatCard icon={<UserPlus size={16} />} label="New this week" value={m.newThisWeek} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={<CalendarDays size={16} />} label="Sessions" value={m.sessions} tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
        <StatCard icon={<TrendingUp size={16} />} label="Completed swaps" value={m.completedSwaps} tone="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
        <StatCard icon={<Coins size={16} />} label="Credits exchanged" value={m.creditsExchanged} tone="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatCard icon={<Star size={16} />} label="Avg rating" value={m.avgRating > 0 ? m.avgRating.toFixed(2) : "—"} tone="bg-yellow-500/10 text-yellow-600" />
        <StatCard icon={<ShieldAlert size={16} />} label="Open reports" value={m.openReports} tone="bg-red-500/10 text-red-500" />
        <StatCard icon={<Coins size={16} />} label="Revenue" value={m.revenue > 0 ? `$${m.revenue}` : "—"} tone="bg-secondary text-muted-foreground" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-display text-sm font-bold">Sessions per day (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={m.sessionsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs><linearGradient id="sessFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sessFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-display text-sm font-bold">Top skills by sessions</h3>
          <div className="space-y-2.5">
            {m.topSkills.slice(0, 7).map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="w-36 truncate text-sm font-semibold">{s.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (s.count / Math.max(1, m.topSkills[0]?.count ?? 1)) * 100)}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: SafeUser[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [adjustFor, setAdjustFor] = React.useState<SafeUser | null>(null);
  const [amount, setAmount] = React.useState(0);
  const [reason, setReason] = React.useState("");

  const action = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      await post(`/api/admin/users/${id}`, body);
      toastSuccess(msg);
      router.refresh();
    } catch (err) {
      toastError("Action failed", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const visible = users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()) || u.username.includes(q));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="max-w-xs" />
        <Badge variant="secondary">{visible.length} shown</Badge>
      </div>
      <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
        {visible.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar src={u.image} name={u.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                {u.name} {u.role !== "USER" && <Badge variant="accent">{u.role}</Badge>}
                {u.status === "SUSPENDED" && <Badge variant="destructive">Suspended</Badge>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email ?? u.username} · {u.credits} credits · {u.rating.toFixed(1)}★ · {u.completedSessions} swaps</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setAdjustFor(u)}><Coins size={13} /> Adjust</Button>
              {u.status === "SUSPENDED" ? (
                <Button size="sm" variant="success" onClick={() => action(u.id, { action: "UNSUSPEND" }, "Account reactivated.")}><RotateCcw size={13} /> Reactivate</Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => action(u.id, { action: "SUSPEND" }, "Account suspended.")}><Ban size={13} /> Suspend</Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Modal open={Boolean(adjustFor)} onClose={() => setAdjustFor(null)} title={`Adjust credits — ${adjustFor?.name ?? ""}`} description="Add or remove Skill Credits. Every change is recorded in the ledger." footer={
        <>
          <Button variant="outline" onClick={() => setAdjustFor(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!adjustFor || !amount) return;
              await action(adjustFor.id, { action: "ADJUST_CREDITS", amount, reason: reason || "Admin adjustment" }, "Balance adjusted.");
              setAdjustFor(null); setAmount(0); setReason("");
            }}
          >Apply</Button>
        </>
      }>
        <div className="space-y-3">
          <Input type="number" value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} placeholder="+3 or -1" aria-label="Amount" />
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (visible to the user)…" rows={2} />
        </div>
      </Modal>
    </Card>
  );
}

function SessionsTab({ sessions }: { sessions: AdminData["sessions"] }) {
  const router = useRouter();
  const resolve = async (id: string, action: "COMPLETE" | "CANCEL") => {
    try {
      await post(`/api/admin/sessions/${id}`, { action });
      toastSuccess("Session updated.");
      router.refresh();
    } catch (err) {
      toastError("Action failed", err instanceof Error ? err.message : "Please try again.");
    }
  };
  return (
    <Card className="divide-y divide-border overflow-hidden">
      {sessions.slice(0, 25).map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Badge variant={s.status === "COMPLETED" ? "success" : s.status === "CONFIRMED" ? "default" : s.status === "REQUESTED" ? "warning" : "destructive"}>{s.status}</Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{s.skillName} · {s.teacherName} → {s.learnerName}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(s.startTime)} · {s.duration} min · {s.credits} credit{s.credits > 1 ? "s" : ""}</p>
          </div>
          {s.status === "REQUESTED" && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="success" onClick={() => resolve(s.id, "COMPLETE")}><Check size={13} /></Button>
              <Button size="sm" variant="destructive" onClick={() => resolve(s.id, "CANCEL")}><X size={13} /></Button>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

function SkillsTab({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("TECHNOLOGY");
  const [desc, setDesc] = React.useState("");

  const create = async () => {
    if (name.trim().length < 2) return toastError("Enter a skill name");
    try {
      await post("/api/admin/skills", { name: name.trim(), category, description: desc || null });
      toastSuccess(`Added "${name.trim()}"`);
      setName(""); setDesc("");
      router.refresh();
    } catch (err) {
      toastError("Couldn't add skill", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const remove = async (id: string, name_: string) => {
    try {
      await fetch(`/api/admin/skills?id=${id}`, { method: "DELETE" });
      toastSuccess(`Removed "${name_}"`);
      router.refresh();
    } catch {
      toastError("Couldn't remove skill");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-bold">Add a skill</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name (e.g. Excel)" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{CATEGORY_LABEL[c.key]}</option>)}
          </Select>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description…" />
          <Button onClick={create}><Plus size={15} /> Add</Button>
        </div>
      </Card>
      <Card className="divide-y divide-border overflow-hidden">
        {skills.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <Badge variant="secondary">{CATEGORY_LABEL[s.category] ?? s.category}</Badge>
            <p className="flex-1 truncate text-sm font-semibold">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.popularity} pop</p>
            <button onClick={() => remove(s.id, s.name)} aria-label={`Remove ${s.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ReportsTab({ reports }: { reports: AdminData["reports"] }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");

  const resolve = async (id: string, action: "RESOLVE" | "DISMISS") => {
    try {
      await post(`/api/admin/reports/${id}`, { action, note: note || null });
      toastSuccess(action === "RESOLVE" ? "Report resolved." : "Report dismissed.");
      setNote("");
      router.refresh();
    } catch (err) {
      toastError("Action failed", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <div className="space-y-3">
      {reports.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No reports — the community is on its best behaviour 🎉</Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={r.status === "OPEN" ? "warning" : r.status === "RESOLVED" ? "success" : "secondary"}>{r.status}</Badge>
              <Badge variant="outline">{r.type}</Badge>
              <p className="text-sm font-bold">{r.reporterName} reported {r.reportedName}</p>
              <span className="ml-auto text-xs text-muted-foreground">{relativeTime(r.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm font-semibold">{r.reason}</p>
            {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
            {r.adminNote && <p className="mt-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs">Admin note: {r.adminNote}</p>}
            {r.status === "OPEN" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Admin note…" className="max-w-sm" />
                <Button size="sm" variant="success" onClick={() => resolve(r.id, "RESOLVE")}><Check size={13} /> Resolve</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, "DISMISS")}><X size={13} /> Dismiss</Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
