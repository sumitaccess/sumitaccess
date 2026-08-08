import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const F = (p: string) => readFileSync(p);
const fonts = [
  { name: "Inter", data: F("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff"), weight: 600 as const, style: "normal" as const },
  { name: "Jakarta", data: F("node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff"), weight: 800 as const, style: "normal" as const },
];
const fallback = (async () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==") as unknown as (code: string, segment: string) => Promise<string | any[]>;

const shots: [string, string][] = [
  ["Landing page", "landing.png"],
  ["Dashboard", "dashboard.png"],
  ["Discover", "discover.png"],
  ["Profile", "profile.png"],
  ["Wallet", "wallet.png"],
  ["Messages / chat", "chat.png"],
  ["Mobile home (390px)", "mobile-home.png"],
];

async function main() {
  const items = shots.map(([label, file]) => {
    const b64 = readFileSync(`previews/${file}`).toString("base64");
    return { label, src: `data:image/png;base64,${b64}` };
  });
  const W = 1240, H = 500, PAD = 26;
  const cols = 3, rows = 3;
  const cellW = (W - PAD * (cols + 1)) / cols;
  const cellH = (H - PAD * (rows + 1)) / rows;
  const node = (
    <div style={{ display: "flex", width: W, height: H, background: "#0b0b10", padding: PAD, flexWrap: "wrap", gap: PAD }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", flexDirection: "column", width: cellW, height: cellH, background: "#15151c", borderRadius: 14, overflow: "hidden", border: "1px solid #26262f" }}>
          <img src={it.src} width={cellW} height={cellH - 34} style={{ objectFit: "cover", display: "flex" }} />
          <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: 34, fontFamily: "Inter", color: "#c9c9d4", fontSize: 13, fontWeight: 600 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
  const svg = await satori(node as any, { width: W, height: H, fonts, loadAdditionalAsset: fallback });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1860 } }).render().asPng();
  mkdirSync("previews", { recursive: true });
  writeFileSync("previews/contact-sheet.png", png);
  console.log("✓ previews/contact-sheet.png");
}
main().catch((e) => { console.error(e); process.exit(1); });
