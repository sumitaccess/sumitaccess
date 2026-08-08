// ============================================================================
// Deterministic local avatar generator.
// Writes premium gradient SVG avatars to public/avatars/<username>.svg so the
// demo works fully offline (external avatar CDNs are not guaranteed to be
// reachable in every environment). Swap for real uploads in production.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const PALETTES: [string, string][] = [
  ["#4f46e5", "#7c3aed"], // indigo → violet
  ["#0ea5e9", "#6366f1"], // sky → indigo
  ["#059669", "#10b981"], // emerald
  ["#d97706", "#f59e0b"], // amber
  ["#e11d48", "#f43f5e"], // rose
  ["#0891b2", "#06b6d4"], // cyan
  ["#7c3aed", "#c026d3"], // violet → fuchsia
  ["#2563eb", "#0ea5e9"], // blue → sky
  ["#db2777", "#f472b6"], // pink
  ["#334155", "#64748b"], // slate
  ["#16a34a", "#84cc16"], // green → lime
  ["#ea580c", "#f97316"], // orange
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarSvg(username: string, name: string, seedIndex: number): string {
  const [c1, c2] = PALETTES[seedIndex % PALETTES.length];
  const letters = initials(name);
  // Deterministic pseudo-random decorative circles
  const dot1 = 18 + ((seedIndex * 37) % 40);
  const dot2 = 60 + ((seedIndex * 53) % 30);
  const dot3 = 34 + ((seedIndex * 71) % 45);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)"/>
  <circle cx="${dot1}" cy="${dot2}" r="46" fill="#ffffff" opacity="0.08"/>
  <circle cx="${256 - dot3}" cy="${dot3}" r="30" fill="#ffffff" opacity="0.06"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="'Plus Jakarta Sans','Inter',system-ui,sans-serif"
        font-size="92" font-weight="700" fill="#ffffff" letter-spacing="1">${letters}</text>
</svg>`;
}

export function writeAvatar(username: string, name: string, seedIndex: number): string {
  const dir = path.join(process.cwd(), "public", "avatars");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${username}.svg`;
  fs.writeFileSync(path.join(dir, filename), avatarSvg(username, name, seedIndex));
  return `/avatars/${filename}`;
}
