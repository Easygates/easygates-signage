// ─── Database backup format ────────────────────────────────────────────────
// Pure serialisation / validation helpers — deliberately no database imports,
// so `node --test` can load this module directly and the SQL lives in the
// /api/backup route. A backup is one JSON file holding every row of the seven
// signage tables, plus a small manifest. Media files themselves are not in the
// database: `assets` only stores their URLs.

export const BACKUP_FORMAT = "novasign-backup";
export const BACKUP_VERSION = 1;
export const BACKUP_APP = "NovaSign";

/** Tables in dependency order — parents first, so a restore can insert in this order. */
export const BACKUP_TABLES = [
  "assets",
  "scenes",
  "playlists",
  "playlist_items",
  "displays",
  "schedules",
  "settings",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
export type BackupRow = Record<string, unknown>;

export const RESTORE_ORDER: BackupTable[] = [...BACKUP_TABLES];

/** Primary key column per table (used to spot malformed rows before touching the DB). */
export const BACKUP_PRIMARY_KEY: Record<BackupTable, string> = {
  assets: "id",
  scenes: "id",
  playlists: "id",
  playlist_items: "id",
  displays: "id",
  schedules: "id",
  settings: "key",
};

/** A 25 MB JSON file is far larger than any realistic signage database. */
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
export const MAX_BACKUP_ROWS_PER_TABLE = 100_000;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  app: string;
  createdAt: string;
  /** "supabase" / "local" / "remote" — no host names or credentials. */
  provider?: string;
  counts: Record<BackupTable, number>;
  tables: Record<BackupTable, BackupRow[]>;
}

export type BackupCheck =
  | { ok: true; backup: BackupFile; warnings: string[] }
  | { ok: false; error: string };

const isRow = (value: unknown): value is BackupRow =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTableName = (value: string): value is BackupTable =>
  (BACKUP_TABLES as readonly string[]).includes(value);

/** Build a backup document from rows read out of PostgreSQL. */
export function makeBackup(input: {
  tables: Partial<Record<BackupTable, readonly BackupRow[]>>;
  createdAt?: string | Date;
  provider?: string;
}): BackupFile {
  const tables = {} as Record<BackupTable, BackupRow[]>;
  const counts = {} as Record<BackupTable, number>;

  for (const table of BACKUP_TABLES) {
    const rows = (input.tables[table] ?? []).filter(isRow);
    tables[table] = rows;
    counts[table] = rows.length;
  }

  const createdAt =
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt || new Date().toISOString();

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    createdAt,
    ...(input.provider ? { provider: input.provider } : {}),
    counts,
    tables,
  };
}

/**
 * Check an uploaded file before it reaches the database. Every row must carry a
 * usable primary key, unknown non-empty tables are rejected (rather than
 * silently dropped), and a future format version gets a clear message.
 */
export function validateBackupFile(input: unknown): BackupCheck {
  if (!isRow(input)) {
    return { ok: false, error: "This file isn't a NovaSign backup — expected a JSON object." };
  }

  if (input.format !== BACKUP_FORMAT) {
    const found = typeof input.format === "string" && input.format ? `"${input.format}"` : "missing";
    return {
      ok: false,
      error: `This file isn't a NovaSign backup (format is ${found}; expected "${BACKUP_FORMAT}").`,
    };
  }

  const version = Number(input.version);
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, error: "The backup has no usable version number." };
  }
  if (version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `That backup was written by a newer NovaSign (format v${version}); this server understands v${BACKUP_VERSION}. Update NovaSign first.`,
    };
  }

  if (!isRow(input.tables)) {
    return { ok: false, error: 'The backup has no "tables" object.' };
  }

  const rawTables = input.tables;
  const unknown = Object.entries(rawTables)
    .filter(([name, rows]) => !isTableName(name) && Array.isArray(rows) && rows.length > 0)
    .map(([name]) => name);
  if (unknown.length) {
    return {
      ok: false,
      error: `Unknown table${unknown.length > 1 ? "s" : ""} in the backup: ${unknown.join(", ")}.`,
    };
  }

  const knownNames = Object.keys(rawTables).filter(isTableName);
  if (knownNames.length === 0) {
    return { ok: false, error: "The backup doesn't contain any NovaSign tables." };
  }

  const tables = {} as Record<BackupTable, BackupRow[]>;
  const warnings: string[] = [];
  let totalRows = 0;

  for (const table of BACKUP_TABLES) {
    const value = rawTables[table];
    if (value === undefined) {
      tables[table] = [];
      continue;
    }
    if (!Array.isArray(value)) {
      return { ok: false, error: `Table "${table}" in the backup is not a list of rows.` };
    }
    if (value.length > MAX_BACKUP_ROWS_PER_TABLE) {
      return {
        ok: false,
        error: `Table "${table}" has ${value.length.toLocaleString()} rows — more than the ${MAX_BACKUP_ROWS_PER_TABLE.toLocaleString()} row limit.`,
      };
    }

    const pk = BACKUP_PRIMARY_KEY[table];
    const rows: BackupRow[] = [];
    for (let i = 0; i < value.length; i++) {
      const row = value[i];
      if (!isRow(row)) {
        return { ok: false, error: `Row ${i + 1} in "${table}" isn't an object.` };
      }
      const key = row[pk];
      if (typeof key !== "string" || !key.trim()) {
        return {
          ok: false,
          error: `Row ${i + 1} in "${table}" is missing its ${pk === "id" ? "id" : '"key"'}.`,
        };
      }
      rows.push(row);
    }
    tables[table] = rows;
    totalRows += rows.length;
  }

  if (totalRows === 0) {
    warnings.push("The backup contains no rows — restoring it will not change anything.");
  }

  return {
    ok: true,
    warnings,
    backup: makeBackup({
      tables,
      createdAt: typeof input.createdAt === "string" ? input.createdAt : undefined,
      provider: typeof input.provider === "string" ? input.provider : undefined,
    }),
  };
}

/** `novasign-backup-2026-10-22-1958.json` (UTC). */
export function backupFileName(when: Date = new Date(), ext: "json" | "sql" = "json"): string {
  const iso = when.toISOString();
  return `novasign-backup-${iso.slice(0, 10)}-${iso.slice(11, 16).replace(":", "")}.${ext}`;
}

/** PostgreSQL string literal — standard_conforming_strings doubles only single quotes. */
export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** One value as a SQL literal, typed well enough for pg to insert it. */
export function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return `${sqlString(value.toISOString())}::timestamptz`;
  if (typeof value === "object") return `${sqlString(JSON.stringify(value))}::jsonb`;
  return sqlString(String(value));
}

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * Render a plain-SQL dump (psql-ready) from a backup document. One INSERT per
 * table, `on conflict do nothing`, wrapped in a transaction. Empty tables are
 * skipped. Column lists come from the exported rows, so a dump stays valid if
 * the schema grows between export and restore as long as the columns exist.
 */
export function toSqlDump(backup: BackupFile, opts: { schema?: string } = {}): string {
  const schema = (opts.schema || "public").trim() || "public";
  const lines: string[] = [];

  lines.push("-- NovaSign database backup");
  lines.push(`-- Created ${backup.createdAt} · format v${backup.version}${backup.provider ? ` · source: ${backup.provider} PostgreSQL` : ""}`);
  lines.push("--");
  lines.push("-- Restore with:");
  lines.push('--   psql "$DATABASE_URL" -f novasign-backup.sql');
  lines.push("-- (create the tables first: supabase/schema.sql or npx drizzle-kit push)");
  lines.push("--");
  lines.push("-- Safe on a non-empty database: rows that already exist are kept");
  lines.push("-- (ON CONFLICT DO NOTHING). Everything runs in one transaction.");
  lines.push("-- Uploaded media files are not in a database dump — copy");
  lines.push("-- public/uploads/ (or the Supabase Storage bucket) separately.");
  lines.push("--");
  for (const table of RESTORE_ORDER) {
    lines.push(`--   ${table}: ${backup.tables[table]?.length ?? 0} row(s)`);
  }
  lines.push("");
  lines.push("begin;");

  for (const table of RESTORE_ORDER) {
    const rows = backup.tables[table] ?? [];
    if (!rows.length) continue;

    // Union of keys, in first-seen order, so every exported column is written.
    const columns: string[] = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!columns.includes(key)) columns.push(key);
      }
    }

    lines.push("");
    lines.push(
      `insert into ${quoteIdent(schema)}.${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) values`
    );
    const values = rows.map(
      (row) => `  (${columns.map((column) => sqlValue(row[column])).join(", ")})`
    );
    lines.push(`${values.join(",\n")} on conflict do nothing;`);
  }

  lines.push("");
  lines.push("commit;");
  return `${lines.join("\n")}\n`;
}
