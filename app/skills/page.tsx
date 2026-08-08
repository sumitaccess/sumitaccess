import Link from "next/link";
import { getAllSkills } from "@/lib/users";
import { query } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { iconFor } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const metadata = { title: "Browse skills" };
export const dynamic = "force-dynamic";

export default async function SkillsBrowsePage() {
  const skills = getAllSkills();
  const counts = new Map<string, number>();
  for (const row of query<{ skillId: string }>("SELECT skill_id AS skillId FROM user_skills WHERE type = 'TEACH'")) {
    counts.set(row.skillId, (counts.get(row.skillId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge variant="secondary" className="mb-3">Skill catalogue</Badge>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Explore every skill</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">From QGIS to guitar — find someone who can teach you anything, and trade what you know in return.</p>

      <div className="mt-10 space-y-12">
        {CATEGORIES.map((c) => {
          const list = skills.filter((s) => s.category === c.key);
          if (list.length === 0) return null;
          return (
            <section key={c.key}>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                {CATEGORY_LABEL[c.key]}
                <span className="text-xs font-semibold text-muted-foreground">{list.length} skills</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((s) => {
                  const Icon = iconFor(s.icon);
                  return (
                    <Link key={s.id} href={`/skills/${s.slug}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft transition-transform group-hover:scale-110", s.color ?? "bg-primary")}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">{counts.get(s.id) ?? 0} teaching</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
