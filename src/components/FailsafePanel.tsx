"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FAILSAFE_MODES, normalizeFailsafe, type FailsafeSettings } from "@/lib/failsafe";
import { FAILSAFE_SCENES } from "@/lib/signage";

type PlaylistLite = { id: string; name: string; scenes?: unknown[] };

/**
 * “Failsafe” tab — what every screen shows when the CMS isn't there.
 *
 * This is the old “demo content” idea, but with a purpose: the demo pack is no
 * longer just seeding material, it is the last-resort slide set that keeps a TV
 * looking like a shop rather than a black rectangle. Three modes, explained in
 * plain language, and a preview link that fakes an outage without unplugging
 * anything.
 */
export default function FailsafePanel({
  playlists,
  onFlash,
}: {
  playlists: PlaylistLite[];
  onFlash: (m: string) => void;
}) {
  const [draft, setDraft] = useState<FailsafeSettings>({ mode: "cache", playlistId: "" });
  const [saved, setSaved] = useState<FailsafeSettings>({ mode: "cache", playlistId: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const f = normalizeFailsafe(j?.failsafe);
        setDraft(f);
        setSaved(f);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const dirty = draft.mode !== saved.mode || draft.playlistId !== saved.playlistId;

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Only the failsafe blob is sent, so saving here can't overwrite the
        // Business tab's brand details.
        body: JSON.stringify({ failsafe: draft }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        onFlash(j.error || "Couldn't save the failsafe — check the database connection");
        return;
      }
      const f = normalizeFailsafe(j.failsafe ?? draft);
      setDraft(f);
      setSaved(f);
      onFlash("Failsafe saved — screens pick it up on their next refresh");
    } catch {
      onFlash("Couldn't save the failsafe — check the database connection");
    } finally {
      setSaving(false);
    }
  };

  const chosen = playlists.find((p) => p.id === draft.playlistId);
  // The preview makes no requests, so it shows this browser's saved copy or the
  // built-in pack — exactly what a screen with no connection would show.
  const testHref = "/display?offline=1";

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">If the internet drops out</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/60">
              A screen should never go black in front of customers. When a player can&apos;t reach this
              CMS — Wi-Fi down, laptop closed, database unreachable — it falls back to the option below.
              It already keeps a copy of its own playlist in the browser, so the safest choice is usually
              to leave it alone.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-mono text-white/60">
            {FAILSAFE_SCENES.length} scenes in the built-in pack
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {FAILSAFE_MODES.map((m) => {
            const active = draft.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setDraft((d) => ({ ...d, mode: m.id }))}
                aria-pressed={active}
                className={`rounded-2xl p-4 text-left ring-1 transition ${
                  active ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white ring-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-black ${active ? "bg-black text-white" : "bg-white/15 text-white/70"}`}>
                    {active ? "✓" : ""}
                  </span>
                  <span className="text-sm font-black">{m.name}</span>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${active ? "text-black/70" : "text-white/55"}`}>{m.blurb}</p>
              </button>
            );
          })}
        </div>

        {draft.mode === "playlist" && (
          <div className="mt-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
            <label className="lbl" htmlFor="failsafe-playlist">
              Playlist to keep on every screen
            </label>
            <select
              id="failsafe-playlist"
              value={draft.playlistId}
              onChange={(e) => setDraft((d) => ({ ...d, playlistId: e.target.value }))}
              className="inp bg-[#141b33]"
            >
              <option value="">— choose a playlist —</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              Screens download this playlist in the background while they can reach the CMS (about every
              5 minutes), so the copy is already on the device when the connection dies. News and price
              changes are therefore as fresh as the last successful download, not live.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            disabled={!dirty || saving || loading}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-black disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save failsafe"}
          </button>
          <button
            onClick={() => setDraft(saved)}
            disabled={!dirty}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold ring-1 ring-white/20 disabled:opacity-40"
          >
            Undo
          </button>
          <Link href={testHref} target="_blank" className="rounded-full bg-amber-400/20 px-4 py-2 text-xs font-black text-amber-200 ring-1 ring-amber-300/40">
            ▶ Preview with the CMS switched off
          </Link>
        </div>
        {draft.mode === "playlist" && !draft.playlistId && (
          <p className="mt-3 text-xs font-bold text-amber-200">
            Pick a playlist — until then this saves as “last playlist it played”.
          </p>
        )}
      </div>

      <div className="rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
        <h3 className="text-sm font-black">What each screen keeps, and when</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="text-white/40">
              <tr>
                <th className="py-2 pr-4 font-bold">Situation</th>
                <th className="py-2 pr-4 font-bold">What the screen does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="py-2 pr-4">Normal refresh (every 30 s)</td>
                <td className="py-2 pr-4 text-white/70">
                  Fetches the live schedule and replaces its saved copy. In “playlist” mode it also
                  refreshes that playlist&apos;s offline copy.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">CMS unreachable, or database down (503)</td>
                <td className="py-2 pr-4 text-white/70">
                  Keeps playing the saved copy — no black screen, no browser error page.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Nothing saved yet (brand-new screen)</td>
                <td className="py-2 pr-4 text-white/70">
                  Plays the {FAILSAFE_SCENES.length}-scene built-in pack, so a screen is never empty.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">
          {draft.mode === "install"
            ? "Because you've chosen the built-in pack, screens ignore saved copies entirely while offline — every outage looks the same."
            : draft.mode === "playlist" && chosen
              ? `Screens keep a copy of “${chosen.name}”. If that copy is missing they use the last playlist they played, and the built-in pack as a last resort.`
              : "Screens use the last playlist they played, and the built-in pack as a last resort."}{" "}
          The preview link opens this browser&apos;s saved copy — useful for checking a screen before it is
          installed.
        </p>
      </div>
    </div>
  );
}
