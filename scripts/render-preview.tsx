// ============================================================================
// SkillSwap — design preview renderer
// Renders faithful previews of key screens (real colors, fonts, copy, seeded
// avatars) to PNG using satori + resvg (the same pure-JS stack Next.js uses
// for OG images). True browser screenshots aren't possible in this sandbox.
//   Run: npx tsx scripts/render-preview.tsx
// ============================================================================

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import * as React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

// ---------------------------------------------------------------- fonts
const F = (p: string) => readFileSync(p);
const fonts = [
  { name: "Inter", data: F("node_modules/@fontsource/inter/files/inter-latin-400-normal.woff"), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: F("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff"), weight: 600 as const, style: "normal" as const },
  { name: "Inter", data: F("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
  { name: "Inter", data: F("node_modules/@fontsource/inter/files/inter-latin-500-normal.woff"), weight: 500 as const, style: "normal" as const },
  { name: "Jakarta", data: F("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff"), weight: 600 as const, style: "normal" as const },
  { name: "Jakarta", data: F("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
  { name: "Jakarta", data: F("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff"), weight: 800 as const, style: "normal" as const },
];

// ---------------------------------------------------------------- tokens
const C = {
  bg: "#ffffff", card: "#ffffff", border: "#e4e4e7", text: "#18181b", muted: "#71717a",
  primary: "#4f46e5", primarySoft: "#eef0ff", success: "#059669", successSoft: "#ecfdf5",
  sky: "#0284c7", skySoft: "#eff6ff", amber: "#f59e0b", red: "#e11d48", redSoft: "#fef2f2",
  secondary: "#f4f4f5", secondary2: "#fafafa",
};
const J = { fontFamily: "Jakarta" };
const I = { fontFamily: "Inter" };

// ---------------------------------------------------------------- avatars
const AV: Record<string, string> = {};
for (const name of ["sumit-sharma", "priya-patel", "aarav-sharma", "meera-krishnan", "rohan-mehta", "ananya-iyer", "neha-gupta", "vikram-singh"]) {
  try {
    const svg = readFileSync(`public/avatars/${name}.svg`, "utf8");
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 256 } }).render().asPng();
    AV[name] = `data:image/png;base64,${png.toString("base64")}`;
  } catch { /* skip */ }
}

// ---------------------------------------------------------------- primitives
const Img = ({ src, size, radius = 999 }: { src: string; size: number; radius?: number }) => (
  <img src={src} width={size} height={size} style={{ borderRadius: radius, objectFit: "cover", display: "flex" }} />
);

const Star = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M11.5 2.5l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.3-5.6 3.3 1.4-6.3L2.5 9l6.4-.6z" fill={C.amber} />
  </svg>
);

const Check = ({ color = C.success, size = 13 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path d="M7 12.5l3.5 3.5L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Verified = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#0ea5e9" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const ArrowR = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const SwapIcon = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M8 4L4 8l4 4M4 8h12M16 20l4-4-4-4M20 16H8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const SparkleIcon = ({ size = 12, color = "#4f46e5" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill={color} /></svg>
);
const PinIcon = ({ size = 11, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" stroke={color} strokeWidth="2" fill="none" /><circle cx="12" cy="10" r="2.4" fill={color} /></svg>
);
const HomeIcon = ({ size = 16, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const CompassIcon = ({ size = 16, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" /><path d="M15.5 8.5l-2 5-5 2 2-5z" fill={color} /></svg>
);
const ChatIcon = ({ size = 16, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const CalendarIcon = ({ size = 16, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth="2" fill="none" /><path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
);
const UserIcon = ({ size = 16, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
);
const BellIcon = ({ size = 22, color = "#71717a" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const Coin = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#eef0ff" stroke="#4f46e5" strokeWidth="1.6" />
    <path d="M8.6 9.2c.5-.9 1.6-1.4 3.4-1.4 1.9 0 3 .7 3 1.9 0 .9-.6 1.5-1.7 1.8-1.6.4-2.6.8-2.6 2 0 1 1 1.6 2.7 1.6 1.7 0 2.7-.6 3.2-1.5" stroke="#4f46e5" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    <path d="M12 6.2v11.6" stroke="#4f46e5" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const Chip = ({ children, color = "#4f46e5", bg = "#eef0ff", border }: { children: string; color?: string; bg?: string; border?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: bg, border: border ? `1px solid ${C.border}` : "none", ...I, fontSize: 11, fontWeight: 600, color }}>
    {children}
  </div>
);

const SkillPill = ({ name, icon, tone = "#0284c7", bg = "#eff6ff", tag }: { name: string; icon?: string; tone?: string; bg?: string; tag?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: "#f4f4f5", border: `1px solid ${C.border}`, ...I, fontSize: 11, fontWeight: 600, color: "#3f3f46" }}>
    {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
    {name}
    {tag && <span style={{ fontSize: 9.5, fontWeight: 700, color: tone, background: bg, padding: "1px 6px", borderRadius: 999 }}>{tag}</span>}
  </div>
);

const MatchRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? C.success : score >= 60 ? C.primary : score >= 40 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", position: "relative", width: 54, height: 54 }}>
      <svg width={54} height={54} viewBox="0 0 54 54">
        <circle cx="27" cy="27" r="23" fill="none" stroke={C.secondary} strokeWidth="5" />
        <circle cx="27" cy="27" r="23" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 144.5} 144.5`} transform="rotate(-90 27 27)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...J, fontWeight: 800, fontSize: 12, color }}>{score}%</span>
      </div>
    </div>
  );
};

const Card = ({ children, p = 18, style }: { children: any; p?: number; style?: any }) => (
  <div style={{ display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: p, boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)", ...style }}>
    {children}
  </div>
);

const Button = ({ children, primary = true, style }: { children: any; primary?: boolean; style?: any }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 18px", borderRadius: 12,
    background: primary ? C.primary : "#fff", color: primary ? "#fff" : C.text, border: primary ? "none" : `1px solid ${C.border}`,
    ...I, fontWeight: 700, fontSize: 13.5, boxShadow: primary ? "0 1px 2px rgba(16,24,40,.08), 0 4px 12px rgba(79,70,229,.18)" : "0 1px 2px rgba(16,24,40,.04)", ...style }}>
    {children}
  </div>
);

// ---------------------------------------------------------------- screens
function Landing() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 800, background: C.bg, padding: "0 48px", position: "relative" }}>
      {/* ambient glow */}
      <div style={{ display: "flex",  position: "absolute", top: -140, left: 200, width: 720, height: 420, borderRadius: 999, background: "rgba(79,70,229,.10)", filter: "blur(60px)" }} />
      {/* nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 7h10l-3-3M17 17H7l3 3" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ ...J, fontWeight: 800, fontSize: 19 }}>Skill<span style={{ color: C.primary }}>Swap</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, ...I, fontSize: 13.5, fontWeight: 600, color: C.muted }}>
          <span>How it works</span><span>Skills</span><span>Why SkillSwap</span>
          <div style={{ display: "flex",  padding: "8px 16px", borderRadius: 10, background: C.primary, color: "#fff", fontWeight: 700 }}>Get started</div>
        </div>
      </div>
      {/* hero */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex",  alignSelf: "flex-start", ...I, fontSize: 11.5, fontWeight: 700, color: C.primary, background: "#eef0ff", border: "1px solid #d6d9ff", padding: "5px 12px", borderRadius: 999 }}>
            Peer-to-peer skill exchange
          </div>
          <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 58, lineHeight: 1.08, letterSpacing: -1.5, marginTop: 18, color: C.text }}>
            Your skills are<br />worth <span style={{ color: C.primary }}>something</span>.
          </div>
          <div style={{ display: "flex",  ...I, fontSize: 16.5, lineHeight: 1.6, color: C.muted, marginTop: 16, maxWidth: 460 }}>
            Teach what you know. Learn what you love. Exchange skills with people who can help you grow — using Skill Credits instead of cash.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <Button style={{ padding: "13px 26px", fontSize: 15 }}>Start Swapping</Button>
            <Button primary={false} style={{ padding: "13px 26px", fontSize: 15 }}>Explore Skills</Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
            <div style={{ display: "flex" }}>
              {["sumit-sharma", "aarav-sharma", "priya-patel", "neha-gupta", "meera-krishnan"].map((a, i) => (
                <div key={a} style={{ display: "flex", marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: 999 }}>
                  <Img src={AV[a]} size={30} />
                </div>
              ))}
            </div>
            <span style={{ ...I, fontSize: 12.5, color: C.muted }}>Trusted by <b style={{ color: C.text }}>12,000+</b> curious learners</span>
          </div>
        </div>
        {/* swap visual */}
        <div style={{ display: "flex", flexDirection: "column", width: 430, background: "#fdfdfe", border: `1px solid ${C.border}`, borderRadius: 22, padding: 24, boxShadow: "0 20px 50px rgba(16,24,40,.10)" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <Card p={16} style={{ flex: 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>G</div>
              <div style={{ display: "flex",  ...I, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 10 }}>You teach</div>
              <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 19 }}>QGIS</div>
              <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>Advanced · 7 yrs experience</div>
            </Card>
            <Card p={16} style={{ flex: 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>P</div>
              <div style={{ display: "flex",  ...I, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 10 }}>You learn</div>
              <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 19 }}>Python</div>
              <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>Beginner · just starting</div>
            </Card>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", margin: "18px 0" }}>
            <div style={{ display: "flex",  position: "absolute", left: 10, right: 10, borderTop: "2px dashed rgba(79,70,229,.35)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eef0ff", border: "1px solid #d6d9ff", borderRadius: 999, padding: "7px 14px", ...I, fontWeight: 700, fontSize: 12.5, color: C.primary }}>
              1 Skill Credit
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f4f4f5", borderRadius: 14, padding: 12, border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "#eef0ff", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontSize: 16 }}></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ ...I, fontWeight: 700, fontSize: 12.5 }}>Perfect two-way exchange</span>
              <span style={{ ...I, fontSize: 11, color: C.muted }}>You teach QGIS  they teach Python. 98% match.</span>
            </div>
            <span style={{ marginLeft: "auto", background: "#ecfdf5", color: C.success, ...I, fontWeight: 700, fontSize: 11, padding: "4px 9px", borderRadius: 999 }}>98%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const matches = [
    { name: "Priya Patel", av: "priya-patel", score: 98, teach: "Python", learn: "QGIS", loc: "Mumbai, India", star: 4.9, n: 42 },
    { name: "Aarav Sharma", av: "aarav-sharma", score: 94, teach: "UI Design", learn: "QGIS", loc: "Delhi, India", star: 4.9, n: 37 },
    { name: "Meera Krishnan", av: "meera-krishnan", score: 86, teach: "SQL", learn: "QGIS", loc: "Bengaluru, India", star: 4.8, n: 31 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 900, background: C.bg, padding: "30px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 32, letterSpacing: -0.8 }}>Good morning, Sumit </div>
          <div style={{ display: "flex",  ...I, fontSize: 13.5, color: C.muted, marginTop: 4 }}>Here's what's happening with your skill swaps today.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#eef0ff", border: "1px solid #d6d9ff", borderRadius: 14, padding: "10px 16px" }}>
          <Coin />
          <span style={{ ...J, fontWeight: 800, fontSize: 19, color: C.primary }}>4</span>
          <span style={{ ...I, fontSize: 12.5, color: C.muted }}>Skill Credits</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
        {/* next session */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex",  ...I, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>Your next session</div>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
            <Img src={AV["priya-patel"]} size={52} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: "#ecfdf5", color: C.success, ...I, fontWeight: 700, fontSize: 10.5, padding: "2px 9px", borderRadius: 999 }}>Confirmed</span>
                <span style={{ ...I, fontSize: 10.5, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>You learn</span>
              </div>
              <span style={{ ...J, fontWeight: 700, fontSize: 15, marginTop: 5 }}>Python for GIS automation · with Priya Patel</span>
              <span style={{ ...I, fontSize: 12, color: C.muted, marginTop: 3 }}>Tue, Aug 11 · 7:00 PM · 60 min · Online · 1 credit</span>
            </div>
            <div style={{ display: "flex",  color: C.muted, fontSize: 18 }}></div>
          </Card>
        </div>
        {/* credits card */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex",  ...I, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>Skill Credits</div>
          <Card p={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Coin size={26} />
              <div style={{ display: "flex" }}>
                <span style={{ ...J, fontWeight: 800, fontSize: 26 }}>4</span>
                <span style={{ ...I, fontSize: 11, color: C.muted }}>  available to spend</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ display: "flex",  flex: 1, background: "#ecfdf5", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
                <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 14, color: C.success }}>+6</div>
                <div style={{ display: "flex",  ...I, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Earned</div>
              </div>
              <div style={{ display: "flex",  flex: 1, background: "#fef2f2", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
                <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 14, color: C.red }}>2</div>
                <div style={{ display: "flex",  ...I, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Spent</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* matches */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26, marginBottom: 10 }}>
        <span style={{ ...J, fontWeight: 700, fontSize: 17 }}>Recommended matches</span>
        <span style={{ ...I, fontSize: 12.5, fontWeight: 700, color: C.primary }}>Explore all </span>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {matches.map((m) => (
          <Card key={m.name} p={15} style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Img src={AV[m.av]} size={46} />
              <div style={{ display: "flex",  flex: 1 }}>
                <div style={{ display: "flex",  ...J, fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Star size={11} /><span style={{ ...I, fontSize: 11, fontWeight: 600 }}>{m.star}</span>
                  <span style={{ ...I, fontSize: 10.5, color: C.muted }}>({m.n})</span>
                </div>
                <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>· {m.loc}</div>
              </div>
              <MatchRing score={m.score} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 11 }}>
              <SkillPill name={m.teach} tone={C.success} bg="#ecfdf5" tag="teach" />
              <SkillPill name={m.learn} tone={C.sky} bg="#eff6ff" tag="learn" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
              <Button style={{ flex: 1, padding: "7px 0", fontSize: 12 }}> Swap request</Button>
              <Button primary={false} style={{ padding: "7px 12px", fontSize: 12 }}>Profile</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* continue learning + activity */}
      <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
        <div style={{ display: "flex",  flex: 1.4 }}>
          <span style={{ ...J, fontWeight: 700, fontSize: 17 }}>Continue learning</span>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {[
              { n: "Python", pct: 75, lvl: "Starting out" },
              { n: "UI Design", pct: 25, lvl: "Starting out" },
              { n: "Data Analytics", pct: 50, lvl: "Building" },
            ].map((s) => (
              <Card key={s.n} p={14} style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SkillPill name={s.n} />
                  <span style={{ ...I, fontSize: 9.5, color: C.muted }}>{s.lvl}</span>
                </div>
                <div style={{ display: "flex",  height: 5, background: C.secondary, borderRadius: 99, marginTop: 12 }}>
                  <div style={{ display: "flex", width: `${s.pct}%`, height: 5, background: C.primary, borderRadius: 99 }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div style={{ display: "flex",  flex: 1 }}>
          <span style={{ ...J, fontWeight: 700, fontSize: 17 }}>Your activity</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
            {[
              { t: "Taught QGIS to Vikram Singh", a: "+1", g: C.success, bg: "#ecfdf5", when: "5d ago" },
              { t: "Session: Python with Priya Patel", a: "1", g: C.red, bg: "#fef2f2", when: "2d ago" },
              { t: "Taught Remote Sensing to Lakshmi Rao", a: "+1", g: C.success, bg: "#ecfdf5", when: "1w ago" },
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 12px", background: C.card }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: x.bg, display: "flex", alignItems: "center", justifyContent: "center", color: x.g, ...J, fontWeight: 800, fontSize: 12 }}>{x.a > "0" ? "↑" : "↓"}</div>
                <div style={{ display: "flex",  flex: 1 }}>
                  <div style={{ display: "flex",  ...I, fontSize: 11.5, fontWeight: 600 }}>{x.t}</div>
                  <div style={{ display: "flex",  ...I, fontSize: 10, color: C.muted }}>{x.when}</div>
                </div>
                <span style={{ ...J, fontWeight: 800, fontSize: 13, color: x.g }}>{x.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Discover() {
  const people = [
    { name: "Priya Patel", av: "priya-patel", star: 4.9, n: 42, loc: "Mumbai, India", teach: ["Python", "Machine Learning", "SQL"], learn: ["Figma"], score: 98 },
    { name: "Aarav Sharma", av: "aarav-sharma", star: 4.9, n: 37, loc: "Delhi, India", teach: ["Figma", "UI Design"], learn: ["Python"], score: 94 },
    { name: "Meera Krishnan", av: "meera-krishnan", star: 4.8, n: 31, loc: "Bengaluru, India", teach: ["SQL", "Data Analytics"], learn: ["QGIS"], score: 86 },
    { name: "Nikhil Joshi", av: "rohan-mehta", star: 4.9, n: 30, loc: "Bengaluru, India", teach: ["Python", "ML"], learn: ["Public Speaking"], score: 82 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 820, background: C.bg, padding: "30px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 30, letterSpacing: -0.8 }}>Find your next skill swap.</div>
          <div style={{ display: "flex",  ...I, fontSize: 13.5, color: C.muted, marginTop: 4 }}>Real people, real skills, scored by compatibility.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 11, padding: "8px 14px", ...I, fontSize: 12.5, fontWeight: 600, color: C.muted }}>
          Filters
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", boxShadow: "0 1px 2px rgba(16,24,40,.04)" }}>
        <span style={{ color: C.muted, fontSize: 15 }}></span>
        <span style={{ ...I, fontSize: 13.5, color: C.muted }}>Search people, skills or cities</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {["All", "Technology", "Design", "Business", "Languages", "Music", "GIS", "Finance"].map((c, i) => (
          <div key={c} style={{ display: "flex", padding: "7px 15px", borderRadius: 999, ...I, fontSize: 12, fontWeight: 600,
            background: i === 0 ? C.primary : "#fff", color: i === 0 ? "#fff" : C.muted, border: i === 0 ? "none" : `1px solid ${C.border}` }}>
            {c}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        {people.map((p) => (
          <Card key={p.name} p={15} style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Img src={AV[p.av]} size={46} />
              <div style={{ display: "flex",  flex: 1 }}>
                <div style={{ display: "flex",  ...J, fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Star size={11} /><span style={{ ...I, fontSize: 11, fontWeight: 600 }}>{p.star}</span>
                  <span style={{ ...I, fontSize: 10.5, color: C.muted }}>({p.n})</span>
                </div>
                <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>· {p.loc}</div>
              </div>
              <MatchRing score={p.score} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 11 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.teach.map((t) => <SkillPill key={t} name={t} tone={C.success} bg="#ecfdf5" tag="teach" />)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.learn.map((t) => <SkillPill key={t} name={t} tone={C.sky} bg="#eff6ff" tag="learn" />)}
              </div>
            </div>
            <div style={{ display: "flex",  background: "#eef0ff", borderRadius: 10, padding: "7px 10px", marginTop: 10 }}>
              <span style={{ ...I, fontSize: 10.5, color: C.primary, lineHeight: 1.5 }}>Perfect two-way exchange — you teach QGIS, they teach {p.teach[0].split(" ")[0]}.</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 11, borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
              <Button style={{ flex: 1, padding: "7px 0", fontSize: 12 }}> Swap request</Button>
              <Button primary={false} style={{ padding: "7px 12px", fontSize: 12 }}>Profile</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 840, background: C.bg, padding: "30px 40px" }}>
      <Card p={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex",  height: 110, background: "linear-gradient(90deg, rgba(79,70,229,.20), rgba(124,58,237,.12), rgba(16,185,129,.10))" }} />
        <div style={{ display: "flex", padding: "0 26px 22px" }}>
          <div style={{ display: "flex",  marginTop: -44, background: C.card, padding: 4, borderRadius: 18, boxShadow: "0 8px 24px rgba(16,24,40,.12)" }}>
            <Img src={AV["aarav-sharma"]} size={96} radius={14} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 16, marginTop: 8, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ ...J, fontWeight: 800, fontSize: 22 }}>Aarav Sharma</span>
              <Verified />
            </div>
            <span style={{ ...I, fontSize: 13, color: C.muted }}>Product Designer · Figma & UI Design</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 7, ...I, fontSize: 12, color: C.muted }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={11} /><b style={{ color: C.text }}>4.9</b> (37 reviews)</span>
              <span>· Delhi, India</span>
              <span> Asia/Kolkata (IST)</span>
              <span> Mon–Fri, 6–10 PM</span>
            </div>
            <span style={{ ...I, fontSize: 13, color: "#3f3f46", marginTop: 10, maxWidth: 640, lineHeight: 1.55 }}>
              Product designer who loves systems thinking. I run design critique circles and I'm finally learning to code so I can ship what I design.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Button style={{ padding: "11px 18px" }}> Send Swap Request</Button>
            <Button primary={false} style={{ padding: "11px 18px" }}>Message</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        {/* teach/learn */}
        <Card p={18} style={{ flex: 1.1 }}>
          <span style={{ ...J, fontWeight: 700, fontSize: 14.5 }}>I can teach</span>
          {["Figma", "UI Design", "UX Research"].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", marginTop: 9, background: "#fafafa" }}>
              <SkillPill name={s} />
              <span style={{ ...I, fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Expert</span>
            </div>
          ))}
        </Card>
        <Card p={18} style={{ flex: 1.1 }}>
          <span style={{ ...J, fontWeight: 700, fontSize: 14.5 }}>I want to learn</span>
          {["Python", "Data Analytics"].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}`, borderRadius: 11, padding: "9px 12px", marginTop: 9, background: "#fafafa" }}>
              <SkillPill name={s} />
              <span style={{ ...I, fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Beginner</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {["First Swap", "5 Swaps", "5-Star Teacher"].map((a) => (
              <span key={a} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f4f4f5", border: `1px solid ${C.border}`, borderRadius: 999, padding: "5px 12px", ...I, fontSize: 11, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </Card>
        {/* compatibility */}
        <Card p={18} style={{ flex: 1.4, background: "#fafaff", border: "1px solid #d6d9ff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MatchRing score={94} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ ...J, fontWeight: 800, fontSize: 17 }}>94% Match</span>
              <span style={{ ...I, fontSize: 11.5, color: C.muted }}>The SkillSwap compatibility engine found:</span>
            </div>
          </div>
          {["Skill compatibility — Aarav teaches exactly what you want", "Similar availability — weekday evenings", "You both speak English & Hindi", "Perfect two-way exchange — you teach QGIS"].map((r) => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, ...I, fontSize: 12 }}>
              <Check /> {r}
            </div>
          ))}
        </Card>
      </div>

      {/* reviews */}
      <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
        {[
          { n: "Neha Gupta", av: "neha-gupta", r: 5, t: "Aarav's critique opened my eyes. My portfolio looks dramatically better now.", tags: ["Helpful", "Knowledgeable", "Punctual"] },
          { n: "Sumit Sharma", av: "sumit-sharma", r: 5, t: "Patient, practical, and the session was perfectly paced. Highly recommend.", tags: ["Helpful", "Friendly", "Clear explanation"] },
        ].map((rv) => (
          <Card key={rv.n} p={16} style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Img src={AV[rv.av]} size={32} />
              <div style={{ display: "flex",  flex: 1 }}>
                <span style={{ ...I, fontWeight: 700, fontSize: 12.5 }}>{rv.n}</span>
              </div>
              <div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={10} />)}</div>
            </div>
            <span style={{ ...I, fontSize: 12, color: "#3f3f46", marginTop: 9, lineHeight: 1.5 }}>"{rv.t}"</span>
            <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
              {rv.tags.map((t) => <Chip key={t} children={t} color="#3f3f46" bg="#f4f4f5" />)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Wallet() {
  const tx = [
    { t: "Taught QGIS to Meera Krishnan", type: "EARNED", a: "+1", g: C.success, bg: "#ecfdf5", when: "8d ago", bal: 5 },
    { t: "Session: Data Analytics with Priya Patel", type: "SPENT", a: "1", g: C.red, bg: "#fef2f2", when: "12d ago", bal: 4 },
    { t: "Taught QGIS to Vikram Singh", type: "EARNED", a: "+1", g: C.success, bg: "#ecfdf5", when: "5d ago", bal: 5 },
    { t: "Taught Remote Sensing to Lakshmi Rao", type: "EARNED", a: "+1", g: C.success, bg: "#ecfdf5", when: "2d ago", bal: 6 },
    { t: "Session: Python with Priya Patel", type: "SPENT", a: "1", g: C.red, bg: "#fef2f2", when: "1d ago", bal: 4 },
    { t: "Welcome to SkillSwap — 3 starter credits ", type: "BONUS", a: "+3", g: C.amber, bg: "#fffbeb", when: "90d ago", bal: 3 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 860, background: C.bg, padding: "30px 40px" }}>
      <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 30, letterSpacing: -0.8 }}>Skill Credits</div>
      <div style={{ display: "flex",  ...I, fontSize: 13.5, color: C.muted, marginTop: 4 }}>Teach an hour, earn a credit. Learn an hour, spend one.</div>

      <Card p={24} style={{ marginTop: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex",  position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: 999, background: "rgba(79,70,229,.08)", filter: "blur(40px)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex",  ...I, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Current balance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <Coin size={34} />
              <span style={{ ...J, fontWeight: 800, fontSize: 46, letterSpacing: -1 }}>4</span>
            </div>
            <div style={{ display: "flex",  ...I, fontSize: 11.5, color: C.muted, marginTop: 4 }}>1 credit = 1 hour of teaching</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", textAlign: "center", border: `1px solid ${C.border}`, background: "#fafafa", borderRadius: 14, padding: "12px 22px" }}>
              <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 20, color: C.success }}>+6</div>
              <div style={{ display: "flex",  ...I, fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>Total earned</div>
            </div>
            <div style={{ display: "flex", textAlign: "center", border: `1px solid ${C.border}`, background: "#fafafa", borderRadius: 14, padding: "12px 22px" }}>
              <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 20, color: C.red }}>2</div>
              <div style={{ display: "flex",  ...I, fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>Total spent</div>
            </div>
          </div>
        </div>
      </Card>

      {/* chart */}
      <Card p={20} style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ ...J, fontWeight: 700, fontSize: 15 }}>Balance history</span>
          <Chip children="Every movement is recorded" color="#3f3f46" bg="#f4f4f5" />
        </div>
        <svg width="1100" height="150" viewBox="0 0 1100 150">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,120 L140,110 L260,95 L380,102 L500,84 L620,70 L740,58 L860,62 L980,40 L1100,30 L1100,150 L0,150 Z" fill="url(#g)" />
          <path d="M0,120 L140,110 L260,95 L380,102 L500,84 L620,70 L740,58 L860,62 L980,40 L1100,30" stroke="#4f46e5" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Card>

      {/* transactions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
        <span style={{ ...J, fontWeight: 700, fontSize: 17 }}>Transaction history</span>
        <span style={{ ...I, fontSize: 11.5, color: C.muted, fontWeight: 600 }}> 12 recorded</span>
      </div>
      <Card p={0} style={{ overflow: "hidden" }}>
        {tx.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: x.bg, display: "flex", alignItems: "center", justifyContent: "center", ...I, fontWeight: 700, fontSize: 12, color: x.g }}>
              {x.type === "EARNED" ? "↑" : x.type === "SPENT" ? "↓" : ""}
            </div>
            <div style={{ display: "flex",  flex: 1 }}>
              <div style={{ display: "flex",  ...I, fontSize: 12.5, fontWeight: 600 }}>{x.t}</div>
              <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>{x.type} · {x.when}</div>
            </div>
            <div style={{ display: "flex",  textAlign: "right" }}>
              <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 13, color: x.g }}>{x.a}</div>
              <div style={{ display: "flex",  ...I, fontSize: 9.5, color: C.muted }}>bal. {x.bal}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Chat() {
  return (
    <div style={{ display: "flex", width: 1200, height: 760, background: C.bg, padding: "30px 40px", gap: 18 }}>
      {/* conversation list */}
      <Card p={0} style={{ width: 300, overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ ...J, fontWeight: 800, fontSize: 17 }}>Messages</span>
        </div>
        {[
          { n: "Priya Patel", av: "priya-patel", m: "Perfect — Tuesday 7 PM works. ", when: "2h", unread: 0, active: true },
          { n: "Vikram Singh", av: "vikram-singh", m: "Your QGIS session was incredibly useful", when: "1d", unread: 0 },
          { n: "Aarav Sharma", av: "aarav-sharma", m: "Hey Sumit! I'd love to learn UI design from you", when: "1d", unread: 2 },
          { n: "Neha Gupta", av: "neha-gupta", m: "That critique was gold!", when: "3d", unread: 0 },
        ].map((c) => (
          <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: c.active ? "#eef0ff" : "transparent" }}>
            <Img src={AV[c.av]} size={38} />
            <div style={{ display: "flex",  flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ ...I, fontSize: 12.5, fontWeight: 700 }}>{c.n}</span>
                <span style={{ ...I, fontSize: 10, color: C.muted }}>{c.when}</span>
              </div>
              <div style={{ display: "flex",  ...I, fontSize: 11, color: c.unread ? C.text : C.muted, fontWeight: c.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }}>{c.m}</div>
            </div>
            {c.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: 999, background: C.primary, color: "#fff", ...I, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.unread}</div>}
          </div>
        ))}
      </Card>
      {/* chat window */}
      <Card p={0} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <Img src={AV["priya-patel"]} size={38} />
          <div style={{ display: "flex",  flex: 1 }}>
            <span style={{ ...I, fontWeight: 700, fontSize: 13.5 }}>Priya Patel</span>
            <div style={{ display: "flex",  ...I, fontSize: 10.5, color: C.muted }}>Data Scientist · Python & ML</div>
          </div>
          <Button style={{ padding: "7px 14px", fontSize: 12 }}>+ Propose a session</Button>
        </div>
        <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, background: "#fafafa" }}>
          <div style={{ display: "flex",  alignSelf: "center", ...I, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" }}>Tuesday, July 28</div>
          <div style={{ display: "flex",  alignSelf: "flex-end", maxWidth: 380, background: C.primary, color: "#fff", borderRadius: 16, borderBottomRightRadius: 6, padding: "10px 14px", ...I, fontSize: 12.5, lineHeight: 1.5 }}>
            Hi Priya! I'm Sumit — I'd love to learn Python, specifically for automating GIS workflows. I can teach QGIS in return.
          </div>
          <div style={{ display: "flex", alignSelf: "flex-start", maxWidth: 380, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, borderBottomLeftRadius: 6, padding: "10px 14px", ...I, fontSize: 12.5, lineHeight: 1.5 }}>
            That's a great swap! GIS + Python is a killer combo. Your QGIS help would be amazing for my mapping dashboards.
          </div>
          <div style={{ display: "flex",  alignSelf: "flex-end", maxWidth: 380, background: C.primary, color: "#fff", borderRadius: 16, borderBottomRightRadius: 6, padding: "10px 14px", ...I, fontSize: 12.5 }}>
            Perfect — shall we do Tuesday 7 PM IST for our first session?
          </div>
          <div style={{ display: "flex", alignSelf: "flex-start", maxWidth: 380, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, borderBottomLeftRadius: 6, padding: "10px 14px", ...I, fontSize: 12.5 }}>
            Tuesday 7 PM works. I'll share the meet link before we start 
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}></div>
          <div style={{ display: "flex", flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", ...I, fontSize: 12.5, color: C.muted, background: "#fff" }}>Message Priya</div>
          <div style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}></div>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Mobile() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 390, height: 844, background: C.bg, overflow: "hidden" }}>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path d="M7 7h10l-3-3M17 17H7l3 3" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ ...J, fontWeight: 800, fontSize: 16 }}>Skill<span style={{ color: C.primary }}>Swap</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#eef0ff", borderRadius: 999, padding: "4px 10px" }}>
            <Coin size={14} /><span style={{ ...J, fontWeight: 800, fontSize: 12, color: C.primary }}>4</span>
          </div>
          <div style={{ display: "flex",  position: "relative", width: 28, height: 28 }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ position: "absolute", top: -2, right: -2, width: 15, height: 15, borderRadius: 999, background: C.primary, color: "#fff", ...I, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex",  padding: "6px 18px 0" }}>
        <div style={{ display: "flex",  ...J, fontWeight: 800, fontSize: 23, letterSpacing: -0.5 }}>Good morning, Sumit </div>
        <div style={{ display: "flex",  ...I, fontSize: 12, color: C.muted, marginTop: 3 }}>Here's what's happening today.</div>
      </div>

      <div style={{ display: "flex",  padding: "14px 18px" }}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
          <Img src={AV["priya-patel"]} size={46} />
          <div style={{ display: "flex",  flex: 1 }}>
            <span style={{ background: "#ecfdf5", color: C.success, ...I, fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 999 }}>Confirmed</span>
            <div style={{ display: "flex",  ...J, fontWeight: 700, fontSize: 13.5, marginTop: 4 }}>Python for GIS automation</div>
            <div style={{ display: "flex",  ...I, fontSize: 11, color: C.muted, marginTop: 2 }}>Tue · 7:00 PM · 60 min · Online</div>
          </div>
          <span style={{ color: C.muted, fontSize: 15 }}></span>
        </Card>
      </div>

      <div style={{ display: "flex",  padding: "6px 18px" }}>
        <span style={{ ...J, fontWeight: 700, fontSize: 14.5 }}>Recommended matches</span>
      </div>
      <div style={{ padding: "10px 18px", display: "flex", gap: 10, overflow: "hidden" }}>
        {[
          { n: "Aarav Sharma", av: "aarav-sharma", s: 94 },
          { n: "Meera Krishnan", av: "meera-krishnan", s: 86 },
        ].map((m) => (
          <Card key={m.n} p={12} style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Img src={AV[m.av]} size={38} />
              <div style={{ display: "flex",  flex: 1 }}>
                <div style={{ display: "flex",  ...I, fontWeight: 700, fontSize: 11.5 }}>{m.n}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={9} /><span style={{ ...I, fontSize: 9.5, color: C.muted }}>4.9</span></div>
              </div>
              <MatchRing score={m.s} />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <SkillPill name="UI Design" />
            </div>
          </Card>
        ))}
      </div>

      {/* bottom nav */}
      <div style={{ marginTop: "auto", borderTop: `1px solid ${C.border}`, background: "#fdfdfe", padding: "8px 10px 14px", display: "flex" }}>
        {[
          { l: "Home", i: "", on: true }, { l: "Discover", i: "", on: false }, { l: "Messages", i: "", on: false, b: 1 },
          { l: "Sessions", i: "", on: false }, { l: "Profile", i: "", on: false },
        ].map((n) => (
          <div key={n.l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
            <span style={{ fontSize: 17, color: n.on ? C.primary : C.muted, opacity: n.on ? 1 : 0.75 }}>{n.i}</span>
            <span style={{ ...I, fontSize: 9.5, fontWeight: 700, color: n.on ? C.primary : C.muted }}>{n.l}</span>
            {n.b ? <div style={{ position: "absolute", top: -2, right: "28%", width: 13, height: 13, borderRadius: 999, background: C.primary, color: "#fff", ...I, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n.b}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- main
async function render(name: string, node: any, width: number, height: number, scale = 1.5) {
  const svg = await satori(node as any, {
    width,
    height,
    fonts,
    // No external emoji CDN access in this sandbox — return a transparent
    // placeholder so rendering never fails on emoji.
    loadAdditionalAsset: (async () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==") as unknown as (code: string, segment: string) => Promise<string | any[]>,
    
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(width * scale) } }).render().asPng();
  mkdirSync("previews", { recursive: true });
  writeFileSync(`previews/${name}.png`, png);
  console.log(` previews/${name}.png (${width}x${height}  ${width * scale}px wide)`);
}

async function main() {
  const only = process.env.ONLY;
  if (only && only !== "landing") { /* skip */ } else try { await render("landing", Landing(), 1200, 800); } catch (e: any) { console.error("landing FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "dashboard") { /* skip */ } else try { await render("dashboard", Dashboard(), 1200, 900); } catch (e: any) { console.error("dashboard FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "discover") { /* skip */ } else try { await render("discover", Discover(), 1200, 820); } catch (e: any) { console.error("discover FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "profile") { /* skip */ } else try { await render("profile", Profile(), 1200, 840); } catch (e: any) { console.error("profile FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "wallet") { /* skip */ } else try { await render("wallet", Wallet(), 1200, 860); } catch (e: any) { console.error("wallet FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "chat") { /* skip */ } else try { await render("chat", Chat(), 1200, 760); } catch (e: any) { console.error("chat FAIL:", e.message.slice(0, 200)); process.exit(1); }
  if (only && only !== "mobile") { /* skip */ } else try { await render("mobile-home", Mobile(), 390, 844, 2); } catch (e: any) { console.error("mobile FAIL:", e.message.slice(0, 200)); process.exit(1); }
  console.log("\nAll previews rendered  previews/");
}

main().catch((e) => { console.error("render failed:", e); process.exit(1); });
