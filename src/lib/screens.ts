// Screen numbers: a short, memorable way to point a TV at its screen.
//
//   http://tv-serv:3000/display?displayId=2        (instead of …?displayId=61248b2e-6f09-…)
//
// Every screen keeps its long id (that never changes and everything else in the database points at
// it); the screen number is an extra, editable label that must be unique. The player accepts either.
//
// Pure functions only (no imports), so `node --test` can load this file directly.

export const MAX_SCREEN_NUMBER = 9999;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ScreenRef = { kind: "id"; id: string } | { kind: "number"; number: number };

/** What a `?displayId=` value refers to: a long id, a screen number, or nothing usable. */
export function parseScreenRef(raw: string | null | undefined): ScreenRef | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (UUID.test(t)) return { kind: "id", id: t.toLowerCase() };
  if (/^\d{1,4}$/.test(t)) {
    const n = Number(t);
    if (n >= 1 && n <= MAX_SCREEN_NUMBER) return { kind: "number", number: n };
  }
  return null;
}

/**
 * A screen number typed into the editor. A whole number 1–9999 is returned as-is, empty means
 * "no number" (null), and anything else is invalid (undefined).
 */
export function parseScreenNumber(input: unknown): number | null | undefined {
  if (input === null || input === "") return null;
  const n = typeof input === "number" ? input : typeof input === "string" && /^\s*\d{1,4}\s*$/.test(input) ? Number(input) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > MAX_SCREEN_NUMBER) return undefined;
  return n;
}

/** The lowest number nobody uses yet: 1, 2, 3 … (a gap left by a deleted screen is reused). */
export function nextScreenNumber(taken: Iterable<number | null | undefined>): number {
  const used = new Set<number>();
  for (const n of taken) if (typeof n === "number") used.add(n);
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** What goes after `displayId=` in a screen's address: its number if it has one, else its long id. */
export function screenRefFor(screen: { id: string; screenNumber?: number | null }): string {
  return typeof screen.screenNumber === "number" ? String(screen.screenNumber) : screen.id;
}
