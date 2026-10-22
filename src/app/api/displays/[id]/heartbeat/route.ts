import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { displays } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Called every 20 s by each shop screen ("I'm online"). Public on purpose: it only
 *  sets status + last-seen on one display and changes nothing else. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await db
      .update(displays)
      .set({ status: "online", lastSeen: new Date() } as never)
      .where(eq(displays.id, id))
      .returning({ id: displays.id });
    if (!rows.length) return NextResponse.json({ error: "unknown display" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    // an invalid id or a database hiccup must never break a screen
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }
}
