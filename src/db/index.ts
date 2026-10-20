import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export interface ResolvedDbInfo {
  connectionString: string;
  ssl: PoolConfig["ssl"];
  host: string;
  port: string;
  database: string;
  provider: "supabase" | "local" | "remote";
  poolerMode: "transaction-6543" | "session-or-direct-5432" | "custom";
}

/**
 * Normalize a PostgreSQL connection string for node-postgres (pg v8.20+),
 * handling both local sandbox PostgreSQL (no TLS) and Supabase
 * (Supavisor pooler ports 6543 / 5432 & direct connections with TLS).
 */
export function resolveDbConfig(rawUrl?: string): ResolvedDbInfo {
  const input = (rawUrl || process.env.DATABASE_URL || "").trim();
  if (!input) {
    throw new Error(
      "DATABASE_URL is required. Set it in .env (local PostgreSQL or Supabase URI)."
    );
  }

  let host = "unknown";
  let port = "5432";
  let database = "postgres";
  let normalized = input;

  try {
    const parsed = new URL(input);
    host = parsed.hostname || "unknown";
    port = parsed.port || "5432";
    database = (parsed.pathname || "/postgres").replace(/^\//, "") || "postgres";

    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "postgres";

    const forceSslOff = process.env.DATABASE_SSL === "false";
    const useSsl = forceSslOff ? false : !isLocalHost || process.env.DATABASE_SSL === "true";

    if (useSsl) {
      // Strip Prisma-only param often copied from Supabase's ORM tab
      parsed.searchParams.delete("pgbouncer");
      // Avoid pg@8.20 treating sslmode=require as strict verify-full against Supavisor intermediates
      if (parsed.searchParams.get("sslmode") !== "verify-full") {
        parsed.searchParams.set("uselibpqcompat", "true");
        parsed.searchParams.set("sslmode", "require");
      }
      normalized = parsed.toString();
    }

    const isSupabase =
      host.endsWith(".supabase.com") || host.endsWith(".supabase.co");
    const provider: ResolvedDbInfo["provider"] = isSupabase
      ? "supabase"
      : isLocalHost
        ? "local"
        : "remote";
    const poolerMode: ResolvedDbInfo["poolerMode"] =
      port === "6543"
        ? "transaction-6543"
        : port === "5432"
          ? "session-or-direct-5432"
          : "custom";

    return {
      connectionString: normalized,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      host,
      port,
      database,
      provider,
      poolerMode,
    };
  } catch {
    // Fallback if password contains unencoded characters before URL encoding
    const isSupabase =
      input.includes(".supabase.com") || input.includes(".supabase.co");
    const isLocal =
      input.includes("127.0.0.1") || input.includes("@localhost");
    return {
      connectionString: input,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      host,
      port,
      database,
      provider: isSupabase ? "supabase" : isLocal ? "local" : "remote",
      poolerMode: input.includes(":6543")
        ? "transaction-6543"
        : "session-or-direct-5432",
    };
  }
}

export const dbInfo = resolveDbConfig();

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: dbInfo.connectionString,
    ssl: dbInfo.ssl,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
