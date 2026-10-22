import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlistItems } from "@/db/schema";
import { and, asc, eq, max } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.playlistId || !body.sceneId) return NextResponse.json({ error: "playlistId + sceneId required" }, { status: 400 });
    const cur = await db.select({ m: max(playlistItems.position) }).from(playlistItems).where(eq(playlistItems.playlistId, body.playlistId));
    const pos = (cur[0]?.m ?? -1) + 1;
    const rows = await db.insert(playlistItems).values({ playlistId: body.playlistId, sceneId: body.sceneId, position: pos, durationOverride: body.durationOverride ?? null, transitionOverride: body.transitionOverride ?? null } as never).returning();
    return NextResponse.json({ item: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Reorder: { playlistId, order: [itemId...] } or update single item
    if (body.order && body.playlistId) {
      for (let i = 0; i < body.order.length; i++) {
        await db.update(playlistItems).set({ position: i } as never).where(and(eq(playlistItems.id, body.order[i]), eq(playlistItems.playlistId, body.playlistId)));
      }
      const items = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, body.playlistId)).orderBy(asc(playlistItems.position));
      return NextResponse.json({ items });
    }
    if (body.id) {
      const rows = await db.update(playlistItems).set({ durationOverride: body.durationOverride ?? null, transitionOverride: body.transitionOverride ?? null } as never).where(eq(playlistItems.id, body.id)).returning();
      return NextResponse.json({ item: rows[0] });
    }
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    await db.delete(playlistItems).where(eq(playlistItems.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
