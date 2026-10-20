import "dotenv/config";
import type { Config } from "drizzle-kit";

// Prefer DIRECT_URL (Supabase Session Pooler :5432 or Direct connection) for schema pushes,
// falling back to DATABASE_URL (local Postgres or Supabase pooler).
const raw = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

if (!raw) {
  throw new Error(
    "Missing DATABASE_URL (or DIRECT_URL) in .env. Cannot run drizzle-kit."
  );
}

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

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: buildDrizzleUrl(raw),
  },
} satisfies Config;
