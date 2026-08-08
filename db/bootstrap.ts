// ============================================================================
// Bootstraps the database when the app starts (schema + seed if empty).
// This is what makes a fresh deployment (e.g. Render) work with zero manual
// setup: the schema is applied and, if there are no users yet, realistic demo
// data is seeded.
// ============================================================================

import { applySchema, get } from "../lib/db";

export function ensureDatabase(): void {
  applySchema();
  const existing = get("SELECT COUNT(*) AS n FROM users");
  if (Number(existing?.n ?? 0) > 0) {
    console.log("[bootstrap] Database already initialised — skipping seed.");
    return;
  }
  console.log("[bootstrap] Fresh database — seeding demo data…");
  // Dynamic import avoids a module cycle (seed.ts imports lib/db).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { seedDatabase } = require("./seed") as typeof import("./seed");
  seedDatabase(false);
}
