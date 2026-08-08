// ============================================================================
// Next.js instrumentation — runs once when the server starts.
// Ensures the database schema exists and seeds demo data on a fresh deploy
// (e.g. Render), so the app "just works" with no setup steps.
// ============================================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDatabase } = await import("./db/bootstrap");
    ensureDatabase();
  }
}
