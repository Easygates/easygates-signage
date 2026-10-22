// Database backup: a JSON file must round-trip all seven tables, be rejected
// when malformed, and produce a psql-ready SQL dump. The route itself is
// static-checked (auth, GET/POST wiring) because these tests run without a DB.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BACKUP_FORMAT,
  BACKUP_TABLES,
  BACKUP_VERSION,
  RESTORE_ORDER,
  backupFileName,
  makeBackup,
  sqlValue,
  toSqlDump,
  validateBackupFile,
} from "../src/lib/backup.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const scene = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Winter Sale",
  template: "price-drop",
  created_at: new Date("2026-10-22T10:00:00.000Z"),
  duration_sec: 10,
  theme: null,
  items: [{ name: "Milk", price: "£1" }],
};
const playlist = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "O'clock loop",
  description: "It's a demo — \"quoted\"",
  loop: true,
};
const playlistItem = {
  id: "33333333-3333-4333-8333-333333333333",
  playlist_id: playlist.id,
  scene_id: scene.id,
  position: 0,
};
const settings = {
  key: "brand",
  value: { name: "Easygates", color: "#0b1020" },
  updated_at: new Date("2026-10-22T10:00:00.000Z"),
};

const fixture = () =>
  makeBackup({
    createdAt: "2026-10-22T19:58:00.000Z",
    provider: "supabase",
    tables: {
      scenes: [scene],
      playlists: [playlist],
      playlist_items: [playlistItem],
      settings: [settings],
    },
  });

describe("backup document", () => {
  it("always contains all seven tables and exact counts", () => {
    const backup = fixture();
    assert.equal(backup.format, BACKUP_FORMAT);
    assert.equal(backup.version, BACKUP_VERSION);
    assert.equal(backup.app, "NovaSign");
    assert.deepEqual(Object.keys(backup.tables), [...BACKUP_TABLES]);
    assert.deepEqual(backup.counts, {
      assets: 0,
      scenes: 1,
      playlists: 1,
      playlist_items: 1,
      displays: 0,
      schedules: 0,
      settings: 1,
    });
    assert.equal(backup.provider, "supabase");
  });

  it("uses a timestamped, filesystem-safe filename", () => {
    const when = new Date("2026-10-22T19:58:45.123Z");
    assert.equal(backupFileName(when), "novasign-backup-2026-10-22-1958.json");
    assert.equal(backupFileName(when, "sql"), "novasign-backup-2026-10-22-1958.sql");
  });

  it("never leaks the database host or credentials", () => {
    const json = JSON.stringify(fixture());
    assert.ok(!json.includes("pooler.supabase.com"));
    assert.ok(!json.includes("password"));
  });
});

describe("backup validation", () => {
  it("accepts a file it produced itself", () => {
    const checked = validateBackupFile(JSON.parse(JSON.stringify(fixture())));
    assert.equal(checked.ok, true);
    assert.deepEqual(checked.warnings, []);
    assert.equal(checked.backup.counts.scenes, 1);
    assert.deepEqual(checked.backup.tables.settings[0].value, settings.value);
  });

  it("rejects files that are not NovaSign backups", () => {
    assert.equal(validateBackupFile(null).ok, false);
    assert.equal(validateBackupFile([{ id: "x" }]).ok, false);
    assert.equal(validateBackupFile({ hello: "world" }).ok, false);
    assert.match(validateBackupFile({ hello: "world" }).error, /isn't a NovaSign backup/);
  });

  it("refuses a backup from a newer format version", () => {
    const future = { ...fixture(), version: BACKUP_VERSION + 1 };
    const checked = validateBackupFile(future);
    assert.equal(checked.ok, false);
    assert.match(checked.error, /newer NovaSign/);
  });

  it("rejects unknown non-empty tables instead of silently dropping data", () => {
    const checked = validateBackupFile({
      ...fixture(),
      tables: { ...fixture().tables, users: [{ id: "u1" }] },
    });
    assert.equal(checked.ok, false);
    assert.match(checked.error, /Unknown table.*users/);
  });

  it("allows unknown empty tables (forward-compatible manifest keys)", () => {
    const checked = validateBackupFile({
      ...fixture(),
      tables: { ...fixture().tables, future_table: [] },
    });
    assert.equal(checked.ok, true);
  });

  it("requires every row to carry its primary key", () => {
    const missingSceneId = {
      ...fixture(),
      tables: { ...fixture().tables, scenes: [{ ...scene, id: "" }] },
    };
    const checked = validateBackupFile(missingSceneId);
    assert.equal(checked.ok, false);
    assert.match(checked.error, /scenes.*missing its id/);

    const missingSettingKey = {
      ...fixture(),
      tables: { ...fixture().tables, settings: [{ value: { name: "x" } }] },
    };
    const keyCheck = validateBackupFile(missingSettingKey);
    assert.equal(keyCheck.ok, false);
    assert.match(keyCheck.error, /settings.*"key"/);
  });

  it("rejects non-array tables and non-object rows", () => {
    const badTable = { ...fixture(), tables: { ...fixture().tables, scenes: { id: "x" } } };
    assert.equal(validateBackupFile(badTable).ok, false);

    const badRow = { ...fixture(), tables: { ...fixture().tables, scenes: ["not a row"] } };
    assert.equal(validateBackupFile(badRow).ok, false);
  });

  it("warns when the backup is empty but still accepts it", () => {
    const checked = validateBackupFile({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt: "2026-10-22T00:00:00.000Z",
      tables: Object.fromEntries(BACKUP_TABLES.map((table) => [table, []])),
    });
    assert.equal(checked.ok, true);
    assert.equal(checked.warnings.length, 1);
    assert.match(checked.warnings[0], /no rows/);
  });
});

describe("SQL dump", () => {
  const dump = () => toSqlDump(fixture());

  it("restores parents before children inside one transaction", () => {
    const sql = dump();
    assert.ok(sql.startsWith("-- NovaSign database backup"));
    assert.match(sql, /^begin;$/m);
    assert.match(sql, /^commit;$/m);
    assert.ok(
      sql.indexOf('insert into "public"."playlists"') <
        sql.indexOf('insert into "public"."playlist_items"'),
      "playlists must be inserted before playlist_items"
    );
    assert.ok(
      sql.indexOf('insert into "public"."scenes"') <
        sql.indexOf('insert into "public"."playlist_items"'),
      "scenes must be inserted before playlist_items"
    );
    assert.deepEqual(RESTORE_ORDER, [...BACKUP_TABLES]);
  });

  it("is safe to run on a database that already has rows", () => {
    assert.match(dump(), /on conflict do nothing;/);
  });

  it("skips empty tables", () => {
    const sql = dump();
    assert.ok(!sql.includes('insert into "public"."assets"'));
    assert.ok(!sql.includes('insert into "public"."displays"'));
    assert.ok(!sql.includes('insert into "public"."schedules"'));
  });

  it("escapes quotes and types jsonb / timestamptz values", () => {
    const sql = dump();
    assert.ok(sql.includes("'O''clock loop'"), "single quotes must be doubled");
    assert.ok(sql.includes("'It''s a demo — \"quoted\"'"), "double quotes stay literal");
    assert.ok(sql.includes("'[{\"name\":\"Milk\",\"price\":\"£1\"}]'::jsonb"), "jsonb arrays");
    assert.ok(sql.includes("'{\"name\":\"Easygates\",\"color\":\"#0b1020\"}'::jsonb"), "jsonb objects");
    assert.ok(sql.includes("::timestamptz"), "dates cast explicitly");
  });

  it("renders primitives correctly", () => {
    assert.equal(sqlValue(null), "null");
    assert.equal(sqlValue(undefined), "null");
    assert.equal(sqlValue(true), "true");
    assert.equal(sqlValue(false), "false");
    assert.equal(sqlValue(10), "10");
    assert.equal(sqlValue("text"), "'text'");
    assert.equal(sqlValue(new Date("2026-10-22T19:58:00.000Z")), "'2026-10-22T19:58:00.000Z'::timestamptz");
    assert.equal(sqlValue({ a: 1 }), `'{"a":1}'::jsonb`);
  });
});

describe("backup wiring", () => {
  const route = read("src/app/api/backup/route.ts");
  const middleware = read("src/middleware.ts");
  const databasePanel = read("src/components/DatabasePanel.tsx");
  const admin = read("src/app/admin/page.tsx");

  it("exposes both a JSON backup and a SQL dump", () => {
    assert.match(route, /export async function GET/);
    assert.match(route, /format.*sql|sql.*format/s);
    assert.match(route, /toSqlDump/);
    assert.match(route, /Content-Disposition/);
  });

  it("can restore with merge and replace modes", () => {
    assert.match(route, /export async function POST/);
    assert.match(route, /mode.*replace/);
    assert.match(route, /jsonb_populate_recordset/);
    assert.match(route, /truncate table/);
    assert.match(route, /on conflict do nothing/);
  });

  it("protects the backup download when ADMIN_PASSWORD is set", () => {
    // a plain GET must no longer be automatically public
    assert.match(middleware, /BACKUP/);
    assert.match(middleware, /!BACKUP\.test\(pathname\)/);
  });

  it("is reachable from the Database tab in the admin", () => {
    assert.match(databasePanel, /BackupPanel/);
    assert.match(read("src/components/BackupPanel.tsx"), /Backup &amp; restore/);
    assert.match(admin, /onRestored=\{load\}/);
  });
});
