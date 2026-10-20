// ─── Stateless session cookie for the CMS login ─────────────────────────────
// One admin password (ADMIN_PASSWORD env var). The cookie value is
// sha256(password); middleware re-hashes it and compares with
// sha256(sha256(password)). The password itself is never in the cookie, and the
// cookie never equals the password. HTTP-only so client JS can't read it.
//
// Stateless validation means the middleware (Edge Runtime) and the /api/auth
// handlers (Node) agree without any shared server state — no session store,
// no database table. The cookie's Max-Age (24 h) is the session TTL.
//
// Screens and the public player APIs never see this cookie.

export const SESSION_COOKIE = "sg_session";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cookie value to issue after a successful login. */
export async function createSession(): Promise<string> {
  if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is not configured on this server");
  return sha256Hex(process.env.ADMIN_PASSWORD);
}

/** true when the cookie proves knowledge of ADMIN_PASSWORD. */
export async function validateSession(token: string | null): Promise<boolean> {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const expected = await sha256Hex(await sha256Hex(process.env.ADMIN_PASSWORD));
  return (await sha256Hex(token)) === expected;
}

/** Stateless — nothing to do server-side; the caller clears the cookie. */
export function destroySession(): void {
  // nothing
}
