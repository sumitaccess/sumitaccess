import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, BookOpen, ArrowRightLeft, Star, TrendingUp } from "lucide-react";
import { getSkillBySlug, getSkillsForUsers, getAllSkills } from "@/lib/users";
import { query } from "@/lib/db";
import { Avatar, Badge, Card, Stars } from "@/components/ui";
import { SkillChip } from "@/components/shared";
import { CATEGORY_LABEL } from "@/lib/constants";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const skill = getSkillBySlug(params.slug);
  if (!skill) return { title: "Skill not found" };
  const teachers = countTeachers(params.slug);
  return {
    title: `Learn ${skill.name} — teachers on SkillSwap`,
    description: `${skill.description ?? `${skill.name} teachers`} Find ${skill.name} teachers on SkillSwap and swap skills instead of paying.`,
    openGraph: { title: `Learn ${skill.name} on SkillSwap`, description: skill.description ?? undefined },
  };
}

export default async function SkillPage({ params }: { params: { slug: string } }) {
  const skill = getSkillBySlug(params.slug);
  if (!skill) notFound();
  const Icon = iconFor(skill.icon);

  const teacherRows = query<{ id: string; name: string; username: string; image: string | null; rating: number; totalReviews: number; headline: string | null }>(
    `SELECT DISTINCT u.id, u.name, u.username, u.image, u.rating, u.total_reviews, u.headline
     FROM user_skills us JOIN users u ON u.id = us.user_id
     WHERE us.skill_id = ? AND us.type = 'TEACH' AND u.status = 'ACTIVE'
     ORDER BY u.rating DESC LIMIT 8`,
    [skill.id],
  );
  const learnerRows = query<{ id: string; name: string; username: string; image: string | null; headline: string | null }>(
    `SELECT DISTINCT u.id, u.name, u.username, u.image, u.headline
     FROM user_skills us JOIN users u ON u.id = us.user_id
     WHERE us.skill_id = ? AND us.type = 'LEARN' AND u.status = 'ACTIVE'
     ORDER BY u.created_at DESC LIMIT 8`,
    [skill.id],
  );
  const related = getAllSkills().filter((s) => s.category === skill.category && s.id !== skill.id).slice(0, 4);
  const teachers = countTeachers(params.slug);
  const learners = countLearners(params.slug);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <span className={cn("flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lift", skill.color ?? "bg-primary")}>
          <Icon size={28} />
        </span>
        <div className="flex-1">
          <Badge variant="secondary">{CATEGORY_LABEL[skill.category] ?? skill.category}</Badge>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Learn {skill.name}</h1>
          {skill.description && <p className="mt-2 max-w-xl text-muted-foreground">{skill.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Users size={15} /> <b className="text-foreground">{teachers}</b> people teaching</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={15} /> <b className="text-foreground">{learners}</b> people learning</span>
            <span className="inline-flex items-center gap-1.5"><Star size={15} className="fill-amber-400 text-amber-400" /> <b className="text-foreground">4.8</b> avg rating</span>
          </div>
        </div>
        <Link
          href="/register"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-lift transition-all hover:bg-primary/90 hover:shadow-glow"
        >
          <ArrowRightLeft size={17} /> Start learning {skill.name}
        </Link>
      </div>

      {/* Teachers */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Users size={18} className="text-primary" /> Top {skill.name} teachers
        </h2>
        {teacherRows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No one is teaching {skill.name} yet — be the first!</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teacherRows.map((t) => (
              <Link key={t.id} href={`/users/${t.username}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
                <Avatar src={t.image} name={t.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold group-hover:text-primary">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.headline || `@${t.username}`}</p>
                </div>
                <div className="text-right">
                  <Stars rating={t.rating} size={11} />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.totalReviews} reviews</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Learners */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <BookOpen size={18} className="text-sky-500" /> People learning {skill.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {learnerRows.map((l) => (
            <Link key={l.id} href={`/users/${l.username}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 text-sm font-semibold shadow-soft transition-all hover:border-primary/30 hover:shadow-lift">
              <Avatar src={l.image} name={l.name} size="xs" />
              {l.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Related */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <TrendingUp size={18} className="text-emerald-500" /> Related skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {related.map((s) => (
            <SkillChip key={s.id} skill={s} size="md" />
          ))}
        </div>
      </section>
    </div>
  );
}

function countTeachers(slug: string): number {
  const skill = getSkillBySlug(slug);
  if (!skill) return 0;
  return Number(query<{ n: number }>("SELECT COUNT(*) AS n FROM user_skills WHERE skill_id = ? AND type = 'TEACH'", [skill.id])[0]?.n ?? 0);
}

function countLearners(slug: string): number {
  const skill = getSkillBySlug(slug);
  if (!skill) return 0;
  return Number(query<{ n: number }>("SELECT COUNT(*) AS n FROM user_skills WHERE skill_id = ? AND type = 'LEARN'", [skill.id])[0]?.n ?? 0);
}
