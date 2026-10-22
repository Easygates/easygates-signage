import "dotenv/config";
import type { Config } from "drizzle-kit";

// Prefer DIRECT_URL (Supabase Session Pooler :5432 or Direct connection) for schema pushes,
// falling back to DATABASE_URL (local Postgres or Supabase pooler).
const raw = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

// drizzle-kit is only needed when pushing schema — during `next build` we don't have a DB.
// Provide a placeholder so the import doesn't crash the build when DATABASE_URL is unset.
const drizzleUrl = raw || "postgresql://postgres:postgres@localhost:5432/app_db";

function buildDrizzleUrl(input: string): string {
  try {
    const parsed = new URL(input);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1" ||
      parsed.hostname === "postgres";
    if (!isLocal && process.env.DATABASE_SSL !== "false") {
      parsed.searchParams.delete("pgbouncer");
      if (parsed.searchParams.get("sslmode") !== "verify-full") {
        parsed.searchParams.set("uselibpqcompat", "true");
        parsed.searchParams.set("sslmode", "require");
      }
    }
    return parsed.toString();
  } catch {
    return input;
  }
}

if (!raw && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("Missing DATABASE_URL (or DIRECT_URL) — drizzle-kit will use a placeholder; `npx drizzle-kit push` needs a real .env.");
}

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: buildDrizzleUrl(drizzleUrl),
  },
} satisfies Config;
