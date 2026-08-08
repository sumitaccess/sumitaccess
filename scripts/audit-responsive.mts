// ============================================================================
// Responsive hazard audit v2 — real analysis of className strings.
// ============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx$/.test(f)) files.push(p);
  }
};
for (const d of ["app", "components"]) walk(join(ROOT, d));

const classRe = /className="([^"]+)"/g;

interface Hazard { file: string; sev: "HIGH" | "MED"; what: string; cls: string }

const hazards: Hazard[] = [];
const push = (h: Hazard) => hazards.push(h);

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = file.replace(ROOT + "/", "");
  for (const m of src.matchAll(classRe)) {
    const cls = m[1];
    const tokens = cls.split(/\s+/);

    // --- Grid columns: base (unprefixed) counts that apply at mobile ---
    const baseCols = tokens.filter((t) => /^grid-cols-[2-9]$/.test(t));
    for (const t of baseCols) {
      const n = Number(t.split("-")[2]);
      const hasBreakpoint = tokens.some((x) => x.startsWith("sm:") || x.startsWith("md:") || x.startsWith("lg:") || x.startsWith("xl:"));
      if (n >= 3 && !hasBreakpoint) push({ file: rel, sev: "HIGH", what: `${t} at ALL sizes incl. 390px`, cls });
      else if (n === 2 && !hasBreakpoint) push({ file: rel, sev: "MED", what: `${t} at mobile (usually OK for compact cards)`, cls });
      else if (n >= 3) push({ file: rel, sev: "MED", what: `${t} base + breakpoints`, cls });
    }

    // --- min-width literals ---
    for (const t of tokens) {
      const mw = t.match(/^min-w-\[(\d+)px\]$/);
      if (mw) {
        const px = Number(mw[1]);
        if (px >= 280) push({ file: rel, sev: "HIGH", what: `min-width ${px}px — can overflow 390px viewport`, cls });
        else if (px >= 180) push({ file: rel, sev: "MED", what: `min-width ${px}px`, cls });
      }
    }

    // --- whitespace-nowrap without truncate/overflow in the SAME class string ---
    if (tokens.includes("whitespace-nowrap")) {
      const safe = tokens.some((t) => t.includes("truncate") || t.includes("overflow-x-auto") || t.includes("no-scrollbar") || t === "flex-1");
      if (!safe) push({ file: rel, sev: "MED", what: "whitespace-nowrap without truncate/scroll container", cls });
    }

    // --- fixed viewport-height layouts (mobile nav overlap risk) ---
    for (const t of tokens) {
      if (t.startsWith("h-[calc(100vh")) {
        push({ file: rel, sev: "MED", what: `viewport-height: ${t} — verify mobile nav offset`, cls });
      }
    }

    // --- fixed overlays ---
    if (tokens.includes("fixed")) {
      const hasBottomZero = tokens.includes("bottom-0") || tokens.includes("inset-0") || tokens.includes("inset-x-0") && tokens.includes("bottom-0");
      const escapesOnDesktop = tokens.some((t) => t.startsWith("lg:"));
      if (hasBottomZero && !escapesOnDesktop) {
        push({ file: rel, sev: "MED", what: "fixed to viewport bottom — verify it doesn't fight the bottom nav", cls });
      }
    }
  }
}

const order = { HIGH: 0, MED: 1 };
hazards.sort((a, b) => order[a.sev] - order[b.sev]);

console.log(`\n📐 Responsive hazard audit — ${files.length} TSX files, ${hazards.length} findings\n`);
let high = 0;
for (const h of hazards) {
  if (h.sev === "HIGH") high++;
  console.log(`${h.sev === "HIGH" ? "❌" : "⚠️"} [${h.sev}] ${h.file}`);
  console.log(`     ${h.what}`);
  console.log(`     class: ${h.cls.slice(0, 130)}`);
}
console.log(`\n${high === 0 ? "🎉 No HIGH-severity hazards" : `❌ ${high} HIGH-severity hazards to review`}`);
