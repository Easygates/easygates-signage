"use client";

import { useRef, useState, useSyncExternalStore } from "react";

const TABLES = [
  "assets",
  "scenes",
  "playlists",
  "playlist_items",
  "displays",
  "schedules",
  "settings",
] as const;
type TableName = (typeof TABLES)[number];

const LAST_BACKUP_KEY = "sg-last-backup-at";
const MAX_BYTES = 25 * 1024 * 1024;

type Mode = "merge" | "replace";
type Busy = "json" | "sql" | "restore" | null;

interface Pending {
  name: string;
  text: string;
  createdAt?: string;
  counts: Partial<Record<TableName, number>>;
}

interface RestoreResult {
  inserted: number;
  mode: Mode;
  counts: Partial<Record<TableName, number>>;
}

function filenameFrom(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/);
  return match?.[1]?.trim() || null;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** localStorage is only read after hydration (see `mounted`), so the server
 *  and the first client render agree on "No backup taken yet". */
function readStoredLastBackup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export default function BackupPanel({
  onFlash,
  onRestored,
}: {
  onFlash: (msg: string) => void;
  onRestored?: () => void;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  // True only after hydration; keeps the localStorage-backed label out of SSR.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [mode, setMode] = useState<Mode>("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const lastBackupAt = lastBackup ?? (mounted ? readStoredLastBackup() : null);

  async function download(format: "json" | "sql") {
    setBusy(format);
    setError("");
    try {
      const res = await fetch(`/api/backup?format=${format}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body && typeof body.detail === "string" ? ` — ${body.detail}` : "";
        throw new Error(`${body?.error || `The server answered ${res.status}.`}${detail}`);
      }
      const blob = await res.blob();
      const name = filenameFrom(res.headers.get("content-disposition")) ||
        `novasign-backup.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      const at = new Date().toISOString();
      setLastBackup(at);
      try {
        localStorage.setItem(LAST_BACKUP_KEY, at);
      } catch {
        /* ignore quota/private-mode errors — the file has still downloaded */
      }
      onFlash(format === "sql" ? `SQL dump downloaded (${name})` : `Database backup downloaded (${name})`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPending(null);
    setResult(null);
    setError("");
    setConfirmReplace(false);
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 25 MB.`);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError("That file isn't valid JSON. Choose a novasign-backup-….json file.");
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setError("That file isn't a NovaSign backup.");
      return;
    }

    const obj = parsed as Record<string, unknown>;
    if (obj.format !== "novasign-backup") {
      setError('That file isn\'t a NovaSign backup — it has no "novasign-backup" marker.');
      return;
    }
    const version = Number(obj.version);
    if (Number.isInteger(version) && version > 1) {
      setError("That backup was made by a newer NovaSign. Update the app before restoring it.");
      return;
    }

    const rawTables =
      obj.tables && typeof obj.tables === "object" && !Array.isArray(obj.tables)
        ? (obj.tables as Record<string, unknown>)
        : {};
    const counts: Partial<Record<TableName, number>> = {};
    for (const table of TABLES) {
      const rows = rawTables[table];
      counts[table] = Array.isArray(rows) ? rows.length : 0;
    }

    setPending({
      name: file.name,
      text: JSON.stringify(parsed),
      createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
      counts,
    });
  }

  async function restore() {
    if (!pending || busy) return;
    if (mode === "replace" && !confirmReplace) return;

    setBusy("restore");
    setError("");
    try {
      const res = await fetch(`/api/backup?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: pending.text,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = body && typeof body.detail === "string" ? ` — ${body.detail}` : "";
        const hint = body && typeof body.hint === "string" ? ` ${body.hint}` : "";
        throw new Error(`${body?.error || `The server answered ${res.status}.`}${detail}${hint}`);
      }

      const restoredMode: Mode = body?.mode === "replace" ? "replace" : "merge";
      setResult({
        inserted: typeof body?.inserted === "number" ? body.inserted : 0,
        mode: restoredMode,
        counts: (body?.counts ?? {}) as Partial<Record<TableName, number>>,
      });
      setPending(null);
      setConfirmReplace(false);
      if (fileRef.current) fileRef.current.value = "";
      onFlash(
        `Database restored — ${body?.inserted ?? 0} row(s) written${
          restoredMode === "replace" ? " after wiping the old tables" : ""
        }`
      );
      onRestored?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const totalRows = pending
    ? Object.values(pending.counts).reduce((sum, n) => sum + (n ?? 0), 0)
    : 0;

  return (
    <div className="space-y-4 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">💾 Backup &amp; restore</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/65">
            Download every row of the seven signage tables (scenes, playlists, screens,
            schedules, media library and settings) as one file. Keep a copy somewhere safe
            before big changes, or move a whole setup to another server.
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-widest uppercase text-white/60">
          {lastBackupAt ? `Last backup ${new Date(lastBackupAt).toLocaleString()}` : "No backup taken yet"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
          <div className="text-sm font-black">JSON backup (.json)</div>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Complete backup, restorable from this page. The safest copy for moving to a new
            database.
          </p>
          <button
            onClick={() => void download("json")}
            disabled={busy !== null}
            className="mt-3 w-full rounded-full bg-white px-4 py-2 text-xs font-black text-black hover:bg-white/90 disabled:opacity-50"
          >
            {busy === "json" ? "Preparing…" : "⬇ Download JSON backup"}
          </button>
        </div>

        <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
          <div className="text-sm font-black">SQL dump (.sql)</div>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Standard <code>INSERT</code> statements for psql, pgAdmin or the Supabase SQL
            Editor. Import only — the restore box below reads JSON.
          </p>
          <button
            onClick={() => void download("sql")}
            disabled={busy !== null}
            className="mt-3 w-full rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50"
          >
            {busy === "sql" ? "Preparing…" : "⬇ Download SQL dump"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
        <div className="text-sm font-black">Restore from a JSON backup</div>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Pick a <code>novasign-backup-….json</code> file. <strong className="text-white/75">Merge</strong>{" "}
          adds rows that don&apos;t exist and leaves current content alone.{" "}
          <strong className="text-white/75">Replace</strong> deletes all seven tables first and
          restores the file exactly — use it to roll back or clone a setup.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => void pickFile(e)}
          disabled={busy !== null}
          className="mt-3 block w-full cursor-pointer rounded-xl bg-white/5 p-2 text-xs text-white/70 ring-1 ring-white/15 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white hover:bg-white/10 disabled:opacity-50"
        />

        {pending && (
          <div className="mt-3 space-y-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/15">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs">
                <span className="font-black text-white">{pending.name}</span>{" "}
                <span className="text-white/50">
                  · {totalRows.toLocaleString()} row(s)
                  {pending.createdAt ? ` · created ${new Date(pending.createdAt).toLocaleString()}` : ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {TABLES.map((table) => (
                <div key={table} className="rounded-xl bg-black/35 p-2 text-center ring-1 ring-white/10">
                  <div className="text-sm font-black">{pending.counts[table] ?? 0}</div>
                  <div className="truncate text-[9px] font-bold tracking-wider uppercase text-white/40">
                    {table.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/75">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "merge"}
                  onChange={() => { setMode("merge"); setConfirmReplace(false); }}
                  className="accent-emerald-400"
                />
                Merge — keep existing rows
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="accent-red-400"
                />
                Replace — wipe &amp; restore
              </label>
            </div>

            {mode === "replace" && (
              <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-red-500/10 p-3 text-xs leading-relaxed text-red-200 ring-1 ring-red-400/30">
                <input
                  type="checkbox"
                  checked={confirmReplace}
                  onChange={(e) => setConfirmReplace(e.target.checked)}
                  className="mt-0.5 accent-red-400"
                />
                <span>
                  I understand every scene, playlist, screen, schedule, media entry and setting
                  currently in the database will be deleted before this file is restored.
                </span>
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void restore()}
                disabled={busy !== null || (mode === "replace" && !confirmReplace)}
                className={`rounded-full px-4 py-2 text-xs font-black text-white disabled:opacity-40 ${
                  mode === "replace" ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                {busy === "restore"
                  ? "Restoring…"
                  : mode === "replace"
                    ? "Replace database with this backup"
                    : "Merge this backup into the database"}
              </button>
              <button
                onClick={() => { setPending(null); setConfirmReplace(false); if (fileRef.current) fileRef.current.value = ""; }}
                disabled={busy !== null}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-black ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-3 rounded-2xl bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-200 ring-1 ring-emerald-400/25">
            <strong>
              Restored {result.inserted.toLocaleString()} row(s) ({result.mode === "replace" ? "replace" : "merge"}).
            </strong>{" "}
            {TABLES.filter((table) => (result.counts[table] ?? 0) > 0)
              .map((table) => `${table.replace("_", " ")} ${result.counts[table]}`)
              .join(" · ")}
            {result.mode === "replace" && (
              <span className="mt-2 block">
                Existing screens pick up the restored content on their next poll (≤ 30 s).
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/15 p-3 text-xs leading-relaxed text-red-200 ring-1 ring-red-400/30">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-300/25">
        <strong>What a backup does not contain:</strong> uploaded image and video files. Scenes
        store their URLs, so also copy <code>public/uploads/</code> — or download the Supabase
        Storage bucket if <code>SUPABASE_URL</code> is set. Backups include the Fully Kiosk
        passwords stored on each screen&apos;s settings, so keep the file private. When{" "}
        <code>ADMIN_PASSWORD</code> is set, downloading or restoring a backup requires the admin
        login.
      </div>
    </div>
  );
}
