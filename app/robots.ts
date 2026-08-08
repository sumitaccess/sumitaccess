import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/onboarding", "/messages", "/sessions", "/wallet", "/settings"] }],
    sitemap: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
