import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, dbInfo } from "@/db";
import {
  BACKUP_TABLES,
  MAX_BACKUP_BYTES,
  backupFileName,
  makeBackup,
  toSqlDump,
  validateBackupFile,
  type BackupFile,
  type BackupRow,
  type BackupTable,
} from "@/lib/backup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Readable, deterministic ordering so two exports of an unchanged database are
// byte-for-byte comparable (handy when diffing backups).
const TABLE_QUERIES: Record<BackupTable, string> = {
  assets: 'select * from "assets" order by "created_at" asc, "id" asc',
  scenes: 'select * from "scenes" order by "created_at" asc, "id" asc',
  playlists: 'select * from "playlists" order by "created_at" asc, "id" asc',
  playlist_items: 'select * from "playlist_items" order by "playlist_id" asc, "position" asc',
  displays: 'select * from "displays" order by "created_at" asc, "id" asc',
  schedules: 'select * from "schedules" order by "priority" desc, "created_at" asc, "id" asc',
  settings: 'select * from "settings" order by "key" asc',
};

/** Every row of every table, as raw DB column names (snake_case). */
async function readTables(): Promise<Record<BackupTable, BackupRow[]>> {
  const tables = {} as Record<BackupTable, BackupRow[]>;
  for (const table of BACKUP_TABLES) {
    const result = await db.execute<BackupRow>(sql.raw(TABLE_QUERIES[table]));
    tables[table] = result.rows ?? [];
  }
  return tables;
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * GET /api/backup            → downloadable JSON backup (restorable in /admin)
 * GET /api/backup?format=sql → plain SQL dump for psql / pgAdmin / Supabase
 *
 * The JSON backup holds the seven tables in snake_case (exactly as Postgres
 * stores them) plus a manifest with counts. Media files are not included.
 */
export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") === "sql" ? "sql" : "json";

  try {
    const tables = await readTables();
    const backup = makeBackup({ tables, provider: dbInfo.provider });
    const fileName = backupFileName(new Date(backup.createdAt), format);

    if (format === "sql") {
      return new NextResponse(toSqlDump(backup), {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("backup export failed", err);
    return NextResponse.json(
      { error: "backup-failed", detail: errorText(err) },
      { status: 503 }
    );
  }
}

/**
 * POST /api/backup?mode=merge|replace — restore a JSON backup.
 *
 * merge   → insert rows that don't exist yet; keep everything else untouched.
 * replace → wipe the seven tables first, then restore the file exactly.
 *
 * Rows are inserted with `jsonb_populate_recordset`, so the JSON stays in DB
 * column names and PostgreSQL does the type conversion (timestamptz, jsonb…).
 * `on conflict do nothing` keeps both modes safe when a file contains the same
 * id twice; the response reports how many rows were actually inserted.
 */
export async function POST(req: Request) {
  const mode: "merge" | "replace" =
    new URL(req.url).searchParams.get("mode") === "replace" ? "replace" : "merge";

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BACKUP_BYTES) {
    return NextResponse.json(
      { error: `That file is larger than the ${Math.round(MAX_BACKUP_BYTES / 1024 / 1024)} MB limit.` },
      { status: 413 }
    );
  }

  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BACKUP_BYTES) {
    return NextResponse.json(
      { error: `That file is larger than the ${Math.round(MAX_BACKUP_BYTES / 1024 / 1024)} MB limit.` },
      { status: 413 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "That file isn't valid JSON." }, { status: 400 });
  }

  const checked = validateBackupFile(parsed);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  try {
    const { backup } = checked;
    const counts = await restore(backup, mode);
    const inserted = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return NextResponse.json({
      restored: true,
      mode,
      backupVersion: backup.version,
      backupCreatedAt: backup.createdAt,
      inserted,
      counts,
      warnings: checked.warnings,
    });
  } catch (err) {
    console.error("backup restore failed", err);
    return NextResponse.json(
      {
        error: "restore-failed",
        detail: errorText(err),
        hint: /relation .* does not exist/i.test(errorText(err))
          ? "The tables are missing — run supabase/schema.sql (or npx drizzle-kit push) first."
          : undefined,
      },
      { status: 503 }
    );
  }
}

async function restore(backup: BackupFile, mode: "merge" | "replace"): Promise<Record<BackupTable, number>> {
  return db.transaction(async (tx) => {
    if (mode === "replace") {
      // No FK constraints today, but cascade keeps this correct if any are added.
      await tx.execute(
        sql.raw(
          `truncate table ${BACKUP_TABLES.map((table) => `"${table}"`).join(", ")} restart identity cascade`
        )
      );
    }

    const counts = {} as Record<BackupTable, number>;
    for (const table of BACKUP_TABLES) {
      const rows = backup.tables[table] ?? [];
      if (!rows.length) {
        counts[table] = 0;
        continue;
      }
      const target = sql.raw(`"${table}"`);
      const result = await tx.execute(
        sql`insert into ${target} select * from jsonb_populate_recordset(null::${target}, ${JSON.stringify(rows)}::jsonb) on conflict do nothing returning 1`
      );
      counts[table] = result.rows.length;
    }
    return counts;
  });
}
