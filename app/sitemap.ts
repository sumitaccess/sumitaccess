import type { MetadataRoute } from "next";
import { getAllSkills } from "@/lib/users";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const skills = getAllSkills().map((s) => ({ url: `${base}/skills/${s.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 }));
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...skills,
  ];
}
