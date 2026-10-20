import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db, dbInfo } from "@/db";
import { assets, displays, playlists, scenes, schedules } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const storageMode =
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "supabase-storage"
      : "local-disk";

  let schemaSql = "";
  try {
    schemaSql = await readFile(
      path.join(process.cwd(), "supabase", "schema.sql"),
      "utf8"
    );
  } catch {
    schemaSql = "";
  }

  try {
    await db.execute(sql`select 1`);
    const latencyMs = Date.now() - started;

    const [scCount, plCount, asCount, dpCount, shCount] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(scenes),
      db.select({ n: sql<number>`count(*)::int` }).from(playlists),
      db.select({ n: sql<number>`count(*)::int` }).from(assets),
      db.select({ n: sql<number>`count(*)::int` }).from(displays),
      db.select({ n: sql<number>`count(*)::int` }).from(schedules),
    ]);

    return NextResponse.json({
      connected: true,
      latencyMs,
      provider: dbInfo.provider,
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      poolerMode: dbInfo.poolerMode,
      ssl: Boolean(dbInfo.ssl),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      storageMode,
      counts: {
        scenes: scCount[0]?.n ?? 0,
        playlists: plCount[0]?.n ?? 0,
        assets: asCount[0]?.n ?? 0,
        displays: dpCount[0]?.n ?? 0,
        schedules: shCount[0]?.n ?? 0,
      },
      schemaSql,
    });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        latencyMs: Date.now() - started,
        provider: dbInfo.provider,
        host: dbInfo.host,
        port: dbInfo.port,
        database: dbInfo.database,
        poolerMode: dbInfo.poolerMode,
        ssl: Boolean(dbInfo.ssl),
        hasDirectUrl: Boolean(process.env.DIRECT_URL),
        storageMode,
        error: err instanceof Error ? err.message : "connection-failed",
        schemaSql,
      },
      { status: 500 }
    );
  }
}
