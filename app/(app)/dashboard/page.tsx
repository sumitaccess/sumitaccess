import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getWallet } from "@/lib/credits";
import { getUpcomingSessionsForUser, listSessionsForUser } from "@/lib/sessions";
import { getSkillsForUsers, getUserById, getUserSkills, getSkillById, safeUserPublic } from "@/lib/users";
import { computeMatch } from "@/lib/matching";
import { getMatchBetween, listIncomingRequests } from "@/lib/matches";
import { IncomingRequests, type IncomingRequest } from "@/components/dashboard/incoming-requests";
import { query } from "@/lib/db";
import type { PersonCard, SafeUser } from "@/types";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { NextSessionCard } from "@/components/dashboard/next-session-card";
import { ActivityList } from "@/components/dashboard/activity-list";
import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress-chart";
import { PersonCard as PersonCardUI } from "@/components/people/person-card";
import { SectionHeading, SkillChip } from "@/components/shared";
import { ArrowRight, CalendarDays, Compass, Wallet } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const wallet = getWallet(user.id);
  const nextSessions = getUpcomingSessionsForUser(user.id, 2);
  const learnSkills = getUserSkills(user.id, "LEARN");
  const teachSkills = getUserSkills(user.id, "TEACH");
  const completed = listSessionsForUser(user.id, "completed");
  const incoming: IncomingRequest[] = listIncomingRequests(user.id).map((m) => ({
    id: m.id,
    userAId: m.userAId,
    skillName: m.requestedSkillId ? (getSkillById(m.requestedSkillId)?.name ?? undefined) : undefined,
  }));

  // Recommended matches — scored by the real matching engine
  const viewerSkills = { teach: teachSkills, learn: learnSkills };
  const candidateRows = query<{ id: string }>(
    `SELECT id FROM users WHERE id != ? AND status = 'ACTIVE' AND role != 'ADMIN'
     ORDER BY rating DESC, completed_sessions DESC LIMIT 24`,
    [user.id],
  );
  const ids = candidateRows.map((r) => r.id);
  const skillsMap = getSkillsForUsers(ids);

  const recs: PersonCard[] = [];
  for (const id of ids) {
    const candidate = getUserById(id);
    if (!candidate) continue;
    const teach = skillsMap[id]?.filter((s) => s.type === "TEACH") ?? [];
    const learn = skillsMap[id]?.filter((s) => s.type === "LEARN") ?? [];
    const { score, reasons } = computeMatch(user, candidate, viewerSkills, { teach, learn });
    const existing = getMatchBetween(user.id, id);
    if (existing?.status === "BLOCKED") continue;
    recs.push({
      user: safeUserPublic(candidate) as SafeUser,
      teach,
      learn,
      matchScore: score,
      matchReasons: reasons,
      matchStatus: existing?.status ?? undefined,
      existingMatchId: existing?.id ?? undefined,
      mutualCount: 0,
    });
  }
  recs.sort((a, b) => b.matchScore - a.matchScore);
  const topRecs = recs.slice(0, 4);

  return (
    <div className="space-y-8">
      <DashboardGreeting name={user.name.split(" ")[0]} credits={wallet.balance} />

      {incoming.length > 0 && <IncomingRequests requests={incoming} />}

      {/* Next session + wallet snapshot */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading
            title="Your next session"
            subtitle="What's coming up"
            action={
              <Link href="/sessions" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                All sessions <ArrowRight size={14} />
              </Link>
            }
          />
          {nextSessions.length > 0 ? (
            <div className="space-y-3">
              {nextSessions.map((s) => (
                <NextSessionCard key={s.id} session={s} viewerId={user.id} />
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No sessions booked yet"
                description="Book your first session with a match, or explore who's teaching what you want to learn."
                action={
                  <Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90">
                    <Compass size={15} /> Discover people
                  </Link>
                }
              />
            </Card>
          )}
        </div>

        <div>
          <SectionHeading
            title="Skill Credits"
            subtitle="Your balance"
            action={
              <Link href="/wallet" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                Wallet <ArrowRight size={14} />
              </Link>
            }
          />
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet size={22} />
              </span>
              <div>
                <p className="font-display text-3xl font-extrabold tabular-nums">{wallet.balance}</p>
                <p className="text-xs text-muted-foreground">available to spend</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-center">
              <div className="rounded-xl bg-emerald-500/5 py-2.5">
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+{wallet.totalEarned}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Earned</p>
              </div>
              <div className="rounded-xl bg-red-500/5 py-2.5">
                <p className="text-sm font-extrabold text-red-500">−{wallet.totalSpent}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Spent</p>
              </div>
            </div>
            {teachSkills.length === 0 && (
              <p className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                💡 Teach a 1-hour session to <span className="font-bold text-foreground">earn +1 credit</span>.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Recommended matches */}
      <section>
        <SectionHeading
          title="Recommended matches"
          subtitle="Scored by the SkillSwap compatibility engine"
          action={
            <Link href="/discover" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Explore all <ArrowRight size={14} />
            </Link>
          }
        />
        {topRecs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {topRecs.map((p) => (
              <PersonCardUI key={p.user.id} person={p} compact />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            title="We couldn't find your perfect match yet"
            description="Try adding another skill or expanding your availability."
            action={
              <Link href="/settings" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90">
                Add Skills
              </Link>
            }
          />
        )}
      </section>

      {/* Continue learning */}
      <section>
        <SectionHeading
          title="Continue learning"
          subtitle="Skills you're working on"
          action={
            <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Manage <ArrowRight size={14} />
            </Link>
          }
        />
        {learnSkills.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learnSkills.map((ls) => {
              const sessionsDone = completed.filter((s) => s.skillId === ls.skillId).length;
              const pct = Math.min(100, sessionsDone * 25);
              return (
                <Link key={ls.id} href={`/skills/${ls.skill.slug}`} className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <SkillChip skill={ls.skill} size="md" />
                    <span className="text-xs font-bold text-muted-foreground">
                      {ls.level === "BEGINNER" ? "Starting out" : ls.level === "INTERMEDIATE" ? "Building" : "Leveling up"}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 6)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {sessionsDone === 0 ? "Book your first session" : `${sessionsDone} session${sessionsDone > 1 ? "s" : ""} completed`}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">
            You haven't added any learning goals yet.{" "}
            <Link href="/settings" className="font-bold text-primary hover:underline">Add what you want to learn</Link> to get better matches.
          </Card>
        )}
      </section>

      {/* Activity + weekly progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            title="Your activity"
            subtitle="Recent credit movements"
            action={
              <Link href="/wallet" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <ActivityList transactions={wallet.transactions.slice(0, 6)} />
        </div>
        <div>
          <SectionHeading title="Weekly progress" subtitle="Sessions in the last 4 weeks" />
          <WeeklyProgressChart userId={user.id} />
        </div>
      </div>
    </div>
  );
}
