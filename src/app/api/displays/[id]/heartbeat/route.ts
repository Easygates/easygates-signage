import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { findDisplay } from "@/lib/screenLookup";

export const dynamic = "force-dynamic";

/** Called every 20 s by each shop screen ("I'm online"). Public on purpose: it only
 *  sets status + last-seen on one display and changes nothing else. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // the screen calls this with whatever is in its ?displayId= (its number or its long id)
    const screen = await findDisplay(id);
    if (!screen) return NextResponse.json({ error: "unknown display" }, { status: 404 });
    await db.update(displays).set({ status: "online", lastSeen: new Date() } as never).where(eq(displays.id, screen.id));
    return NextResponse.json({ ok: true });
  } catch {
    // an invalid id or a database hiccup must never break a screen
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }
}
