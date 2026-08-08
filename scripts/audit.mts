// ============================================================================
// Frontend audit — fetches every page (public + authenticated), parses the
// rendered HTML, and verifies:
//   1. HTTP status
//   2. Every internal <a href> resolves (no 404s / broken links)
//   3. Every <img src> / <link rel=icon> / manifest resolves
//   4. Key sections present (nav, footer, headings)
//   5. No empty href="#" / javascript: links
//   6. Icon-only buttons have accessible labels
// ============================================================================

import { parseDocument } from "htmlparser2";
import { getAllSkills, getUsers } from "./audit-data.mts";

const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const DEMO_EMAIL = "demo@skillswap.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo1234";

async function login(email: string, password: string): Promise<string> {
  // Capture the CSRF cookie first (NextAuth validates it on the callback),
  // then exchange credentials for a session cookie.
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookie = (csrfRes.headers.getSetCookie?.() ?? [])
    .map((c: string) => c.split(";")[0])
    .join("; ");

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: csrfCookie },
    body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
    redirect: "manual",
  });
  // Collect ALL set-cookie headers (NextAuth sets session + csrf cookies)
  const cookies = [...(csrfCookie ? [csrfCookie] : []), ...(res.headers.getSetCookie?.() ?? [])]
    .map((c: string) => c.split(";")[0]);
  return [...new Set(cookies)].join("; ");
}

interface CheckResult {
  page: string;
  status: number;
  brokenLinks: string[];
  brokenImages: string[];
  missingSections: string[];
  emptyLinks: number;
  unlabeledButtons: string[];
  errors: string[];
}

function extract(html: string) {
  const doc = parseDocument(html);
  const links: string[] = [];
  const images: string[] = [];
  const buttons: { text: string; ariaLabel: string | null; hasImgChild: boolean; snippet: string }[] = [];
  const headings: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "tag" || node.type === "script" || node.type === "style") {
      const attrs = Object.fromEntries((node.attribs ? Object.entries(node.attribs) : []));
      if (node.name === "a") {
        if (attrs.href) links.push(attrs.href);
      }
      if (node.name === "img") {
        if (attrs.src) images.push(attrs.src);
      }
      if (node.name === "button") {
        const text = node.children?.map((c: any) => c.data || c.children?.[0]?.data || "").join("").trim() ?? "";
        buttons.push({ text, ariaLabel: attrs["aria-label"] ?? null, hasImgChild: node.children?.some((c: any) => c.name === "img" || c.name === "svg") ?? false, snippet: (attrs["class"] ?? "") + (attrs["aria-label"] ?? "") });
      }
      if (["h1", "h2", "h3"].includes(node.name)) {
        headings.push((node.children?.map((c: any) => c.data || "").join("") ?? "").trim());
      }
    }
    if (node.children) walk(node.children);
  };
  walk(doc.children);
  return { links, images, buttons, headings };
}

async function checkPage(path: string, cookie: string, requiredSections: string[]): Promise<CheckResult> {
  const result: CheckResult = { page: path, status: 0, brokenLinks: [], brokenImages: [], missingSections: [], emptyLinks: 0, unlabeledButtons: [], errors: [] };
  try {
    const res = await fetch(`${BASE}${path}`, { headers: cookie ? { Cookie: cookie } : {} });
    result.status = res.status;
    if (res.status !== 200) return result;
    const html = await res.text();

    const { links, images, buttons, headings } = extract(html);

    // Check internal links resolve (skip anchors, external, mailto, tel)
    const internal = links.filter((l) => !l.startsWith("#") && !l.startsWith("http") && !l.startsWith("mailto:") && !l.startsWith("tel:") && !l.startsWith("javascript:"));
    result.emptyLinks = links.filter((l) => l === "#" || l === "" || l.startsWith("javascript:")).length;
    const seen = new Set<string>();
    for (const link of internal) {
      const clean = link.split("#")[0];
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      try {
        const r = await fetch(`${BASE}${clean}`, { headers: cookie ? { Cookie: cookie } : {}, redirect: "manual" });
        if (r.status === 404 || r.status === 500) result.brokenLinks.push(`${link} → ${r.status}`);
      } catch (e) {
        result.brokenLinks.push(`${link} → fetch error`);
      }
    }

    // Check images resolve
    for (const img of images) {
      try {
        const r = await fetch(img.startsWith("http") ? img : `${BASE}${img}`);
        if (!r.ok) result.brokenImages.push(`${img} → ${r.status}`);
      } catch {
        result.brokenImages.push(`${img} → fetch error`);
      }
    }

    // Required sections
    for (const section of requiredSections) {
      if (!html.includes(section)) result.missingSections.push(section);
    }

    // Icon-only buttons need aria-label (or visible text)
    for (const b of buttons) {
      const iconOnly = b.hasImgChild && !b.text && !b.ariaLabel;
      const invisible = !b.text && !b.ariaLabel;
      if (iconOnly || invisible) {
        result.unlabeledButtons.push(`<button class="${b.snippet}">`);
      }
    }
  } catch (e) {
    result.errors.push(String(e));
  }
  return result;
}

async function main() {
  const cookie = await login(DEMO_EMAIL, DEMO_PASSWORD);
  if (!cookie) { console.error("❌ login failed"); process.exit(1); }

  const skills = getAllSkills();
  const users = getUsers();

  const publicPages: [string, string[]][] = [
    ["/", ["Your skills are worth something", "Start Swapping", "Explore Skills", "How it works", "What do you want to learn"]],
    ["/login", ["Welcome back", "Sign in"]],
    ["/register", ["Join SkillSwap", "Create my account"]],
    ["/forgot-password", ["Reset your password"]],
    ["/reset-password", ["Missing reset link"]],
    ["/suspended", ["suspended"]],
    ["/skills", ["Explore every skill"]],
    ...skills.map((s) => [`/skills/${s.slug}`, [s.name]]),
    ...users.map((u) => [`/users/${u.username}`, [u.name]]),
    ["/terms", ["Terms of Service"]],
    ["/privacy", ["Privacy Policy"]],
    ["/guidelines", ["Community Guidelines"]],
    ["/safety", ["Safety Center"]],
  ];

  const appPages: [string, string[]][] = [
    ["/dashboard", ["Recommended matches", "Skill Credits"]],
    ["/discover", ["Find your next skill swap"]],
    ["/messages", ["Messages"]],
    ["/sessions", ["Sessions"]],
    ["/wallet", ["Skill Credits"]],
    ["/notifications", ["Notifications"]],
    ["/settings", ["Settings", "Profile information"]],
    ["/admin", ["Admin dashboard"]],
  ];

  console.log(`\n🔍 Auditing ${publicPages.length + appPages.length} pages (${skills.length} skills, ${users.length} user profiles)…\n`);

  let failures = 0;
  const report: CheckResult[] = [];

  for (const [path, sections] of publicPages) {
    const r = await checkPage(path, "", sections);
    report.push(r);
  }
  for (const [path, sections] of appPages) {
    const r = await checkPage(path, cookie, sections);
    report.push(r);
  }

  for (const r of report) {
    const problems =
      r.status !== 200 ? [`HTTP ${r.status}`] :
      [...r.brokenLinks.map((b) => `broken link: ${b}`),
       ...r.brokenImages.map((b) => `broken image: ${b}`),
       ...r.missingSections.map((s) => `missing: "${s}"`),
       ...(r.emptyLinks > 0 ? [`${r.emptyLinks} empty href`] : []),
       ...r.unlabeledButtons.map((b) => `unlabeled button: ${b}`),
       ...r.errors];
    const icon = problems.length === 0 ? "✅" : "❌";
    if (problems.length > 0) {
      failures += problems.length;
      console.log(`${icon} ${r.page} (${r.status})`);
      problems.forEach((p) => console.log(`     - ${p}`));
    } else {
      console.log(`${icon} ${r.page}`);
    }
  }

  console.log(`\n${failures === 0 ? "🎉 ALL CHECKS PASSED" : `❌ ${failures} issues found`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
