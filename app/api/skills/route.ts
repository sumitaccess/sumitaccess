import { getAllSkills } from "@/lib/users";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { ok } from "@/lib/api";

export async function GET() {
  const skills = getAllSkills();
  const grouped = CATEGORIES.map((c) => ({
    key: c.key,
    label: CATEGORY_LABEL[c.key],
    skills: skills.filter((s) => s.category === c.key),
  })).filter((g) => g.skills.length > 0);

  return ok({ skills, grouped });
}

export const dynamic = "force-dynamic";
