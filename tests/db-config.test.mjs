// Automated tests for local vs Supabase DATABASE_URL resolution
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function resolveDbConfig(input, forceSslEnv) {
  const parsed = new URL(input);
  const host = parsed.hostname;
  const port = parsed.port || "5432";
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "postgres";
  const useSsl = forceSslEnv === "false" ? false : !isLocalHost || forceSslEnv === "true";
  if (useSsl) {
    parsed.searchParams.delete("pgbouncer");
    if (parsed.searchParams.get("sslmode") !== "verify-full") {
      parsed.searchParams.set("uselibpqcompat", "true");
      parsed.searchParams.set("sslmode", "require");
    }
  }
  const isSupabase = host.endsWith(".supabase.com") || host.endsWith(".supabase.co");
  return {
    connectionString: parsed.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    provider: isSupabase ? "supabase" : isLocalHost ? "local" : "remote",
    poolerMode: port === "6543" ? "transaction-6543" : "session-or-direct-5432",
  };
}

describe("database URL normalization (local vs Supabase)", () => {
  it("keeps local sandbox PostgreSQL without TLS", () => {
    const cfg = resolveDbConfig("postgresql://postgres:postgres@127.0.0.1:5432/app_db");
    assert.equal(cfg.provider, "local");
    assert.equal(cfg.ssl, false);
  });

  it("enables TLS + uselibpqcompat and strips pgbouncer for Supabase Transaction Pooler", () => {
    const cfg = resolveDbConfig(
      "postgresql://postgres.ref123:secret@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    );
    assert.equal(cfg.provider, "supabase");
    assert.equal(cfg.poolerMode, "transaction-6543");
    assert.deepEqual(cfg.ssl, { rejectUnauthorized: false });
    assert.match(cfg.connectionString, /uselibpqcompat=true/);
    assert.match(cfg.connectionString, /sslmode=require/);
    assert.doesNotMatch(cfg.connectionString, /pgbouncer/);
  });

  it("detects Supabase Session Pooler on port 5432", () => {
    const cfg = resolveDbConfig(
      "postgresql://postgres.ref123:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    );
    assert.equal(cfg.provider, "supabase");
    assert.equal(cfg.poolerMode, "session-or-direct-5432");
  });
});
