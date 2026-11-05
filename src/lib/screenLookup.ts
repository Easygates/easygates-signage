import { eq } from "drizzle-orm";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { parseScreenRef } from "./screens";

/** The screen a `?displayId=` value points at (long id or screen number), or null. */
export async function findDisplay(raw: string | null | undefined) {
  const ref = parseScreenRef(raw);
  if (!ref) return null;
  const rows = await db
    .select()
    .from(displays)
    .where(ref.kind === "id" ? eq(displays.id, ref.id) : eq(displays.screenNumber, ref.number))
    .limit(1);
  return rows[0] ?? null;
}
