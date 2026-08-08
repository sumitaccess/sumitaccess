import { clamp } from "./utils";
import { DAY_NAMES } from "./constants";
import type { Skill, User, UserSkill } from "@/types";

// ============================================================================
// SkillSwap matching engine
// ----------------------------------------------------------------------------
// Computes a compatibility score between two users based on:
//   • Skill swap fit (A wants what B teaches, and vice versa)
//   • Experience compatibility
//   • Language overlap
//   • Availability overlap
//   • Timezone compatibility
//   • Location proximity
//   • Reputation
// Scores are capped at 98 so there is always a little "human" margin.
// Internal weights are intentionally not exposed in the UI.
// ============================================================================

export interface MatchResult {
  score: number;
  reasons: string[];
}

interface SkillMap {
  teach: (UserSkill & { skill: Skill })[];
  learn: (UserSkill & { skill: Skill })[];
}

function timezoneOffsetMinutes(tz: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    const utc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return Math.round((utc - date.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

/** Do the two users' typical waking/business hours overlap by ≥ 2h? */
function timezonesCompatible(tzA: string, tzB: string): boolean {
  if (tzA === tzB) return true;
  const sample = [new Date("2026-01-15T12:00:00Z"), new Date("2026-07-15T12:00:00Z")];
  for (const d of sample) {
    const a = timezoneOffsetMinutes(tzA, d);
    const b = timezoneOffsetMinutes(tzB, d);
    const diff = Math.abs(a - b);
    // If their 9am–9pm local windows overlap by ≥ 2h
    if (diff <= 720) return true;
    if (720 + (diff - 720) <= 1440 - 120) return true; // wrap-around check
  }
  return false;
}

function parseRanges(json: string | null | undefined): Record<string, string[]> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) if (Array.isArray(v)) out[k] = v.map(String);
    return out;
  } catch {
    return {};
  }
}

function minutesOf(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Rough overlap of weekly availability windows. */
function availabilityOverlaps(a: string | null | undefined, b: string | null | undefined): boolean {
  const avA = parseRanges(a);
  const avB = parseRanges(b);
  for (const day of DAY_NAMES) {
    const rA = avA[day] ?? [];
    const rB = avB[day] ?? [];
    if (rA.length === 0 || rB.length === 0) continue;
    for (const ra of rA) {
      for (const rb of rB) {
        const overlap = Math.min(minutesOf(ra.split("-")[1] || "0"), minutesOf(rb.split("-")[1] || "0")) - Math.max(minutesOf(ra.split("-")[0] || "0"), minutesOf(rb.split("-")[0] || "0"));
        if (overlap >= 60) return true;
      }
    }
  }
  return false;
}

function languageOverlap(a: string, b: string): boolean {
  const la = a.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const lb = b.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (la.length === 0 || lb.length === 0) return false;
  return la.some((l) => lb.includes(l));
}

function sameArea(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const strip = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const city = (s: string) => strip(s.split(",")[0].trim());
  return city(a) === city(b);
}

const SKILL_NAME = (s: (UserSkill & { skill: Skill })[]) => (s[0] ? s[0].skill.name : "");

export function computeMatch(viewer: Pick<User, "timezone" | "languages" | "availability" | "location" | "rating">, candidate: Pick<User, "timezone" | "languages" | "availability" | "location" | "rating" | "name">, viewerSkills: SkillMap, candidateSkills: SkillMap): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Candidate teaches what the viewer wants to learn (up to 2 skills, 17 pts each)
  const viewerWants = viewerSkills.learn.map((s) => s.skill.slug);
  const candidateTeaches = candidateSkills.teach;
  const teachMatch = candidateTeaches.filter((s) => viewerWants.includes(s.skill.slug)).slice(0, 2);
  score += teachMatch.length * 17;
  if (teachMatch.length > 0) {
    reasons.push(`${candidate.name || "They"} can teach ${teachMatch.map((s) => s.skill.name).join(" & ")} — exactly what you want to learn.`);
  }

  // 2. Viewer can teach what the candidate wants → two-way swap (up to 2 skills, 14 pts each)
  const candidateWants = candidateSkills.learn.map((s) => s.skill.slug);
  const viewerTeaches = viewerSkills.teach;
  const swapMatch = viewerTeaches.filter((s) => candidateWants.includes(s.skill.slug)).slice(0, 2);
  score += swapMatch.length * 14;
  if (swapMatch.length > 0 && teachMatch.length > 0) {
    reasons.push(`Perfect two-way exchange — you teach ${swapMatch.map((s) => s.skill.name).join(" & ")}, they teach ${teachMatch.map((s) => s.skill.name).join(" & ")}.`);
  } else if (swapMatch.length > 0) {
    reasons.push(`You can teach ${swapMatch.map((s) => s.skill.name).join(" & ")} in return.`);
  }

  // 3. Language overlap
  if (languageOverlap(viewer.languages, candidate.languages)) {
    score += 10;
    reasons.push("You both speak a common language.");
  }

  // 4. Timezone compatibility
  if (timezonesCompatible(viewer.timezone, candidate.timezone)) {
    score += 10;
    reasons.push("Your time zones are compatible for live sessions.");
  }

  // 5. Availability overlap
  if (availabilityOverlaps(viewer.availability, candidate.availability)) {
    score += 10;
    reasons.push("Your weekly availability overlaps.");
  }

  // 6. Experience compatibility — viewer's skill level and candidate's teaching level
  const target = candidateSkills.teach.find((s) => viewerWants.includes(s.skill.slug));
  const viewerLevel = viewerSkills.learn[0]?.level;
  if (target && viewerLevel) {
    const rank = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
    if (rank.indexOf(target.level) > rank.indexOf(viewerLevel)) {
      score += 8;
      reasons.push("Their experience level is a great fit for your goals.");
    }
  }

  // 7. Reputation
  if (candidate.rating >= 4.8) {
    score += 6;
    reasons.push("Top-rated teacher on SkillSwap.");
  } else if (candidate.rating >= 4.5) {
    score += 4;
  }

  // 8. Location proximity
  if (sameArea(viewer.location, candidate.location)) {
    score += 5;
    reasons.push("Based in the same city — in-person sessions possible.");
  }

  const final = clamp(Math.round(score), 0, 98);
  if (final < 20 && reasons.length === 0 && viewerSkills.learn.length > 0) {
    reasons.push("Could be a good match — why not say hello?");
  }
  return { score: final, reasons };
}

export { SKILL_NAME };
