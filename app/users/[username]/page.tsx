import { notFound } from "next/navigation";
import { MapPin, Clock, Globe2, Check, ArrowRightLeft, Star, Trophy } from "lucide-react";
import { getUserByUsername, getUserSkills, getSkillsForUsers, safeUserPublic } from "@/lib/users";
import { listReviewsForUser } from "@/lib/reviews";
import { countUserSessions } from "@/lib/sessions";
import { getMatchBetween } from "@/lib/matches";
import { getCurrentUser } from "@/lib/session";
import { computeMatch } from "@/lib/matching";
import { Avatar, Badge, Card, Stars, VerifiedBadge } from "@/components/ui";
import { SkillChip, MatchRing } from "@/components/shared";
import { ProfileActions } from "@/components/people/profile-actions";
import { availabilitySummary, timezoneLabel } from "@/lib/utils";
import type { SafeUser } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const user = getUserByUsername(params.username);
  if (!user) return { title: "Profile not found" };
  return {
    title: `${user.name} on SkillSwap`,
    description: user.bio?.slice(0, 155) || `${user.name} — teach what you know, learn what you love on SkillSwap.`,
  };
}

export default async function UserProfilePage({ params, searchParams }: { params: { username: string }; searchParams: { swap?: string } }) {
  const user = getUserByUsername(params.username);
  if (!user || user.status !== "ACTIVE") notFound();
  const viewer = await getCurrentUser();

  const teach = getUserSkills(user.id, "TEACH");
  const learn = getUserSkills(user.id, "LEARN");
  const reviews = listReviewsForUser(user.id);
  const stats = countUserSessions(user.id);
  const isSelf = viewer?.id === user.id;
  const relationship = viewer && viewer.id !== user.id ? (getMatchBetween(viewer.id, user.id) ?? null) : null;

  // Compatibility with the viewer (if not self)
  let match: { score: number; reasons: string[] } | null = null;
  let myTeach = [] as ReturnType<typeof getSkillsForUsers>[string];
  if (viewer && viewer.id !== user.id) {
    const viewerSkills = getSkillsForUsers([viewer.id])[viewer.id] ?? [];
    const res = computeMatch(
      viewer,
      user,
      { teach: viewerSkills.filter((s) => s.type === "TEACH"), learn: viewerSkills.filter((s) => s.type === "LEARN") },
      { teach, learn },
    );
    match = { score: res.score, reasons: res.reasons };
    myTeach = viewerSkills.filter((s) => s.type === "TEACH");
  }

  const achievements = buildAchievements(user, stats.completed);
  const safe = safeUserPublic(user) as SafeUser;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent to-emerald-500/15 sm:h-28" aria-hidden />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-2xl bg-card p-1 shadow-lift">
                <Avatar src={safe.image} name={safe.name} size="xl" className="rounded-xl" />
              </div>
              <div className="pb-1">
                <h1 className="flex items-center gap-1.5 font-display text-2xl font-extrabold tracking-tight">
                  {safe.name}
                  {safe.verified && <VerifiedBadge />}
                </h1>
                <p className="text-sm text-muted-foreground">{safe.headline || "SkillSwap member"}</p>
              </div>
            </div>
            {match && <MatchRing score={match.score} size={72} label="match" />}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {safe.location && (
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {safe.location}</span>
            )}
            <span className="inline-flex items-center gap-1.5"><Globe2 size={14} /> {timezoneLabel(safe.timezone)}</span>
            {safe.availability && (
              <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {availabilitySummary(safe.availability)}</span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{safe.rating > 0 ? safe.rating.toFixed(1) : "New"}</span>
              {safe.totalReviews > 0 && <span>({safe.totalReviews} reviews)</span>}
            </span>
          </div>

          {safe.bio && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/85">{safe.bio}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.completed} swaps completed</Badge>
            <Badge variant="secondary">{safe.hoursTaught} hours taught</Badge>
            <Badge variant="secondary">{safe.totalReviews} reviews</Badge>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {!isSelf && viewer && (
        <ProfileActions target={safe} myName={viewer.name} theirTeach={teach} myTeach={myTeach} relationship={relationship} matchScore={match?.score ?? 0} initialSwapOpen={searchParams.swap === "1"} />
      )}

      {/* Skills */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><ArrowRightLeft size={15} /></span>
            I can teach
          </h2>
          {teach.length > 0 ? (
            <div className="space-y-3">
              {teach.map((ts) => (
                <div key={ts.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5">
                  <SkillChip skill={ts.skill} size="sm" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Level</p>
                    <p className="text-xs font-bold">{ts.level.charAt(0) + ts.level.slice(1).toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not teaching yet.</p>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600"><Check size={15} /></span>
            I want to learn
          </h2>
          {learn.length > 0 ? (
            <div className="space-y-3">
              {learn.map((ls) => (
                <div key={ls.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5">
                  <SkillChip skill={ls.skill} size="sm" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Level</p>
                    <p className="text-xs font-bold">{ls.level.charAt(0) + ls.level.slice(1).toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not learning anything right now.</p>
          )}
        </Card>
      </div>

      {/* Compatibility reasons */}
      {match && (
        <Card className="p-6">
          <h2 className="font-display text-base font-bold">Why you two fit</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">The SkillSwap compatibility engine found:</p>
          <ul className="mt-4 space-y-2.5">
            {match.reasons.slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Check size={12} /></span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><Trophy size={15} /></span>
            Achievements
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {achievements.map((a) => (
              <div key={a.label} className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 py-1.5 pl-1.5 pr-4" title={a.label}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-sm shadow-soft">{a.emoji}</span>
                <span className="text-xs font-bold">{a.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No reviews yet — be the first to swap with {safe.name.split(" ")[0]}.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.slice(0, 6).map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={r.reviewer.image} name={r.reviewer.name} size="sm" />
                    <div>
                      <p className="text-sm font-bold">{r.reviewer.name}</p>
                      <Stars rating={r.rating} size={12} />
                    </div>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-sm leading-relaxed text-foreground/85">"{r.comment}"</p>}
                {r.tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.tags.split(",").map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildAchievements(user: NonNullable<ReturnType<typeof getUserByUsername>>, completed: number) {
  const list: { emoji: string; label: string }[] = [];
  if (completed >= 1 || user.completedSessions >= 1) list.push({ emoji: "🏆", label: "First Swap" });
  if (user.hoursTaught >= 10) list.push({ emoji: "🎓", label: "10 Hours Taught" });
  if (completed >= 5 || user.completedSessions >= 5) list.push({ emoji: "🔥", label: "5 Swaps Completed" });
  if (user.rating >= 4.8 && user.totalReviews >= 5) list.push({ emoji: "⭐", label: "5-Star Teacher" });
  return list;
}
