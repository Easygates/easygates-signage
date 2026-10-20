import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const rows = await db.update(playlists).set({ name: body.name, description: body.description, loop: body.loop, updatedAt: new Date() } as never).where(eq(playlists.id, id)).returning();
  return NextResponse.json({ playlist: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
  await db.delete(playlists).where(eq(playlists.id, id));
  return NextResponse.json({ ok: true });
}
