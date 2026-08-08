import { getAllSkills, getUserSkills } from "@/lib/users";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const skills = getAllSkills();
  // "People teaching" counts per skill for the discovery section
  const counts = new Map<string, number>();
  for (const us of await listAllTeachRows()) {
    counts.set(us.skillId, (counts.get(us.skillId) ?? 0) + 1);
  }

  return <LandingPage skills={skills} teachCounts={counts} />;
}

async function listAllTeachRows() {
  const { query } = await import("@/lib/db");
  return query<{ skillId: string }>("SELECT skill_id AS skillId FROM user_skills WHERE type = 'TEACH'");
}
