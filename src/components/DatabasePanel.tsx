"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BackupPanel from "@/components/BackupPanel";

interface DbStatus {
  connected: boolean;
  latencyMs: number;
  provider: "supabase" | "local" | "remote";
  host: string;
  port: string;
  database: string;
  poolerMode: string;
  ssl: boolean;
  hasDirectUrl: boolean;
  storageMode: string;
  counts?: {
    scenes: number;
    playlists: number;
    assets: number;
    displays: number;
    schedules: number;
  };
  rlsDisabled?: string[];
  error?: string;
  schemaSql?: string;
}

const REGIONS = [
  "aws-0-us-east-1",
  "aws-0-us-west-1",
  "aws-0-eu-west-1",
  "aws-0-eu-west-2",
  "aws-0-eu-central-1",
  "aws-0-ap-southeast-1",
  "aws-0-ap-northeast-1",
  "aws-0-sa-east-1",
];

export default function DatabasePanel({
  onFlash,
  onSeed,
  onRestored,
}: {
  onFlash: (msg: string) => void;
  onSeed: () => Promise<void>;
  onRestored?: () => void;
}) {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [checking, setChecking] = useState(false);

  // Interactive Supabase .env builder state
  const [projectRef, setProjectRef] = useState("abcdefghijklmnopqrst");
  const [region, setRegion] = useState("aws-0-eu-west-2");
  const [password, setPassword] = useState("");
  const [includeStorage, setIncludeStorage] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [bucketName, setBucketName] = useState("signage-media");

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch("/api/db-status", { cache: "no-store" });
      const j = (await r.json()) as DbStatus;
      setStatus(j);
    } catch {
      setStatus(null);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const generatedEnv = useMemo(() => {
    const cleanRef = projectRef.trim() || "[PROJECT-REF]";
    const cleanRegion = region.trim() || "aws-0-eu-west-2";
    const encodedPw = password
      ? encodeURIComponent(password)
      : "[YOUR-URL-ENCODED-PASSWORD]";

    const lines = [
      `# Supabase PostgreSQL (Supavisor Pooler)`,
      `DATABASE_URL="postgresql://postgres.${cleanRef}:${encodedPw}@${cleanRegion}.pooler.supabase.com:6543/postgres"`,
      `DIRECT_URL="postgresql://postgres.${cleanRef}:${encodedPw}@${cleanRegion}.pooler.supabase.com:5432/postgres"`,
    ];

    if (includeStorage) {
      lines.push(
        "",
        `# Optional: Supabase Storage for media uploads (/api/upload)`,
        `SUPABASE_URL="https://${cleanRef}.supabase.co"`,
        `SUPABASE_SECRET_KEY="${serviceKey.trim() || "sb_secret_..."}"`,
        `SUPABASE_STORAGE_BUCKET="${bucketName.trim() || "signage-media"}"`
      );
    }

    return lines.join("\n");
  }, [projectRef, region, password, includeStorage, serviceKey, bucketName]);

  const encodedNotice =
    password && encodeURIComponent(password) !== password
      ? `Special characters detected — automatically encoded (${encodeURIComponent(password).length} chars).`
      : null;

  return (
    <div className="space-y-6">
      {/* Live Database Connection Status Card */}
      <div className="rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-3.5 w-3.5 rounded-full ${
                status?.connected
                  ? "bg-emerald-400 shadow-[0_0_16px_#34d399]"
                  : "bg-red-500"
              }`}
            />
            <div>
              <h3 className="text-lg font-black">
                Active Database Connection ·{" "}
                <span className="uppercase text-emerald-300">
                  {status?.provider === "supabase"
                    ? "Supabase Cloud PostgreSQL"
                    : status?.provider === "local"
                      ? "Local Sandbox PostgreSQL"
                      : status?.provider || "Checking…"}
                </span>
              </h3>
              <p className="text-xs text-white/55">
                Host: <code className="text-white/90">{status?.host ?? "…"}</code> · Port:{" "}
                <code className="text-white/90">{status?.port ?? "…"}</code> · Pooler:{" "}
                <code className="text-white/90">{status?.poolerMode ?? "…"}</code> · TLS:{" "}
                <code className="text-white/90">{status?.ssl ? "enabled" : "off (local)"}</code>{" "}
                · Latency: <code className="text-white/90">{status?.latencyMs ?? "—"} ms</code> · Media:{" "}
                <code className="text-white/90">{status?.storageMode ?? "local-disk"}</code>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refresh}
              disabled={checking}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-black ring-1 ring-white/20 hover:bg-white/20"
            >
              {checking ? "Testing…" : "↻ Test Connection"}
            </button>
            <button
              onClick={async () => {
                await onSeed();
                await refresh();
              }}
              className="rounded-full bg-white px-4 py-2 text-xs font-black text-black hover:bg-white/90"
            >
              ✨ Seed demo pack
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Seeding builds example scenes, a playlist and screens so the admin isn&apos;t empty — it is
          setup material, not the offline fallback. What a screen shows when the CMS can&apos;t be
          reached is set on the <strong className="text-white/70">Failsafe</strong> tab.
        </p>

        {status?.error && (
          <div className="mt-4 rounded-2xl bg-red-500/15 p-4 font-mono text-xs text-red-200 ring-1 ring-red-400/30">
            Connection error: {status.error}
          </div>
        )}

        {status?.provider === "supabase" && !!status.rlsDisabled?.length && (
          <div className="mt-4 rounded-2xl bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-300/25">
            <strong>Row Level Security is off</strong> for{" "}
            <code>{status.rlsDisabled.join(", ")}</code> — anyone with your project&apos;s
            publishable key can read and edit these tables through the Supabase Data API.
            Re-run <code>supabase/schema.sql</code> in the SQL Editor to lock them down.
          </div>
        )}

        {status?.counts && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(status.counts).map(([table, count]) => (
              <div
                key={table}
                className="rounded-2xl bg-black/35 p-3.5 text-center ring-1 ring-white/10"
              >
                <div className="text-2xl font-black">{count}</div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-white/45">
                  {table}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export every table for backup / restore a JSON backup */}
      <BackupPanel
        onFlash={onFlash}
        onRestored={() => {
          void refresh();
          onRestored?.();
        }}
      />

      {/* Step-by-Step Interactive Supabase .env Builder */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black">
              Interactive Supabase <code>.env</code> Builder
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-300">
              PG 8.20 + SUPAVISOR READY
            </span>
          </div>
          <p className="text-sm text-white/65">
            Enter your project details from{" "}
            <strong className="text-white">
              Supabase Dashboard → Top Bar &ldquo;Connect&rdquo; → Supavisor Pooler
            </strong>
            . Special characters in your database password (<code>@ # % ? / :</code>) are
            URL-encoded automatically.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="lbl">Supabase Project Reference ID</label>
              <input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="e.g. xyzcompany123456"
                className="inp font-mono"
              />
            </div>
            <div>
              <label className="lbl">Pooler Region Host Prefix</label>
              <input
                list="supabase-regions"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="aws-0-eu-west-2"
                className="inp font-mono"
              />
              <datalist id="supabase-regions">
                {REGIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="lbl">Database Password (auto URL-encoded locally in browser)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Paste your Supabase DB password…"
              className="inp font-mono"
            />
            {encodedNotice && (
              <p className="mt-1.5 text-xs text-emerald-300">{encodedNotice}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-bold text-white/80">
            <input
              type="checkbox"
              checked={includeStorage}
              onChange={(e) => setIncludeStorage(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Also configure optional Supabase Storage bucket for media uploads (
            <code>/api/upload</code>)
          </label>

          {includeStorage && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="lbl">Public Bucket Name</label>
                <input
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  className="inp font-mono"
                />
              </div>
              <div>
                <label className="lbl">Secret Key (Settings → API Keys)</label>
                <input
                  type="password"
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  placeholder="sb_secret_..."
                  className="inp font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="lbl !mb-0">Generated .env Configuration</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedEnv);
                  onFlash("Copied .env configuration to clipboard");
                }}
                className="rounded-lg bg-emerald-400 px-3 py-1 text-xs font-black text-black hover:bg-emerald-300"
              >
                Copy .env Snippet
              </button>
            </div>
            <pre className="overflow-x-auto rounded-2xl bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-300 ring-1 ring-white/10">
              {generatedEnv}
            </pre>
          </div>
        </div>

        {/* Step-by-Step Instructions + SQL Bootstrap */}
        <div className="space-y-4 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
          <h3 className="text-lg font-black">5-Step Switch to Supabase</h3>
          <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-white/75">
            <li>
              <strong className="text-white">Create a project</strong> at{" "}
              <code>supabase.com/dashboard</code> and copy your{" "}
              <strong>Database Password</strong>.
            </li>
            <li>
              Click <strong className="text-white">Connect</strong> in the top bar → select{" "}
              <strong className="text-white">URI / ORMs</strong>. Use{" "}
              <strong className="text-white">Transaction Pooler (port 6543)</strong> for{" "}
              <code>DATABASE_URL</code> and{" "}
              <strong className="text-white">Session Pooler (port 5432)</strong> for{" "}
              <code>DIRECT_URL</code> (works on both IPv4 &amp; IPv6 networks!).
            </li>
            <li>
              Paste the snippet into your project&apos;s <code>.env</code> file (replacing the
              local <code>127.0.0.1:5432</code> line). TLS + Supavisor compatibility are
              applied automatically by <code>src/db/index.ts</code> and{" "}
              <code>drizzle.config.ts</code>.
            </li>
            <li>
              <strong className="text-white">Create the 7 tables</strong> either from your
              terminal:
              <pre className="mt-1.5 rounded-xl bg-black/50 p-3 font-mono text-xs text-amber-300 ring-1 ring-white/10">
                npx drizzle-kit push
              </pre>
              <em>— OR —</em> paste <code>supabase/schema.sql</code> directly into{" "}
              <strong className="text-white">Supabase Dashboard → SQL Editor → Run</strong>{" "}
              (also enables RLS and creates the <code>signage-media</code> Storage bucket):
              {status?.schemaSql && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(status.schemaSql || "");
                    onFlash("Copied supabase/schema.sql — paste into Supabase SQL Editor");
                  }}
                  className="mt-2 block rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20 hover:bg-white/20"
                >
                  📋 Copy Full SQL Schema (supabase/schema.sql)
                </button>
              )}
            </li>
            <li>
              Restart Next.js (<code>npm run dev</code> or <code>npm run build &amp;&amp; npm start</code>)
              and click <strong className="text-white">✨ Load demo</strong> in the header (or{" "}
              <code>POST /api/seed</code>) to seed the 8 promotional scenes into Supabase!
            </li>
          </ol>

          <div className="rounded-2xl bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-300/25">
            <strong>Why Port 6543 + Port 5432 Poolers?</strong> Supabase&apos;s direct database
            host (<code>db.&lt;ref&gt;.supabase.co:5432</code>) uses IPv6 by default. Using
            Supavisor&apos;s pooler host (<code>aws-0-&lt;region&gt;.pooler.supabase.com</code>)
            works seamlessly over standard IPv4 home/retail LANs, Docker containers, Vercel,
            and Railway without requiring the paid IPv4 add-on.
          </div>
        </div>
      </div>
    </div>
  );
}
