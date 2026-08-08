// Apply the SQLite schema (idempotent). Run: npm run db:init
import { applySchema } from "../lib/db";

applySchema();
console.log("✅ Database schema applied (db/dev.db)");
