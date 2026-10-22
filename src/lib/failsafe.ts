// ─── Failsafe: what a screen shows when the CMS can't be reached ────────────
//
// Three things can go wrong on a shop screen, and they need different answers:
//
//  1. the browser can't reach the CMS at all (internet / LAN / router down);
//  2. the CMS is up but the database is down (it answers 503);
//  3. the CMS and database are fine but nothing has been published yet.
//
// In every case the screen must keep showing *something* — a blank TV or a
// browser error page is worse than an out-of-date promotion. Before this file
// there was no control over that: the player quietly kept its last playlist and
// started on the built-in demo pack if it had never loaded one. The demo pack is
// still the last resort, but an operator can now say what the fallback is:
//
//   cache    — keep playing whatever this screen played last (no DB needed)
//   playlist — pre-download a chosen playlist on every successful poll, and play
//              that copy when the CMS disappears
//   install  — always show the pack that ships with the app (“install demo”),
//              which is also the only option that works with no database at all
//
// The decision is a pure function so it can be tested without a browser, and so
// the player has exactly one place where “what do I show now?” is answered.
//
// Data-only (no imports) so `node --test` can load it directly.

export type FailsafeMode = "cache" | "playlist" | "install";

export interface FailsafeSettings {
  mode: FailsafeMode;
  /** only used by mode "playlist"; "" means nothing chosen yet */
  playlistId: string;
}

export const FAILSAFE_MODES: { id: FailsafeMode; name: string; blurb: string }[] = [
  {
    id: "cache",
    name: "Last playlist it played",
    blurb: "The screen keeps a copy in its browser, so it carries on with the real content through an outage.",
  },
  {
    id: "playlist",
    name: "A playlist I choose",
    blurb: "The screen also downloads this playlist whenever it polls, and falls back to that copy if the CMS goes away.",
  },
  {
    id: "install",
    name: "The built-in demo pack",
    blurb: "The slides that ship with the app. Works with no database at all — useful on day one or as a shop-window loop.",
  },
];

export const DEFAULT_FAILSAFE: FailsafeSettings = { mode: "cache", playlistId: "" };

export function normalizeFailsafe(input: unknown): FailsafeSettings {
  const v = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const mode = FAILSAFE_MODES.some((m) => m.id === v.mode) ? (v.mode as FailsafeMode) : DEFAULT_FAILSAFE.mode;
  const playlistId = typeof v.playlistId === "string" ? v.playlistId.trim().slice(0, 64) : "";
  // A pinned playlist without an id is the same as "cache" — never leave the
  // screen with a mode it cannot honour.
  return { mode: mode === "playlist" && !playlistId ? "cache" : mode, playlistId };
}

export interface FailsafeSources<T> {
  /** the last playlist this screen played successfully (browser cache) */
  lastPlayed?: T[] | null;
  /** the pre-downloaded copy of the pinned playlist, if this screen has one */
  pinned?: { playlistId?: string; scenes: T[] } | null;
  /** the slides bundled with the app — always present */
  installPack: T[];
}

export interface FailsafeResult<T> {
  scenes: T[];
  /** where the slides came from, for the admin and for debugging a screen */
  source: "last-played" | "pinned-playlist" | "install-pack";
}

/**
 * Which slides to show when the CMS is unreachable.
 *
 * - "install" always uses the bundled pack — an operator who picks it wants the
 *   screen to look the same every time it goes offline, not to show stale promos.
 * - "playlist" prefers the downloaded copy, then the last thing that played
 *   (better than a surprise demo if the download never completed).
 * - "cache" prefers the last thing that played.
 * - The bundled pack is the final answer in every mode, so this never returns
 *   an empty list.
 */
export function resolveFailsafe<T>(settings: FailsafeSettings | FailsafeMode | null | undefined, sources: FailsafeSources<T>): FailsafeResult<T> {
  const s = typeof settings === "string" || settings == null ? normalizeFailsafe({ mode: settings }) : normalizeFailsafe(settings);
  const lastPlayed = sources.lastPlayed?.length ? sources.lastPlayed : null;
  const pinned =
    sources.pinned?.scenes?.length && (!s.playlistId || !sources.pinned.playlistId || sources.pinned.playlistId === s.playlistId)
      ? sources.pinned
      : null;

  if (s.mode === "install") return { scenes: sources.installPack, source: "install-pack" };
  if (s.mode === "playlist" && pinned) return { scenes: pinned.scenes, source: "pinned-playlist" };
  if (lastPlayed) return { scenes: lastPlayed, source: "last-played" };
  return { scenes: sources.installPack, source: "install-pack" };
}
