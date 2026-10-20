import { NextResponse } from "next/server";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "location", "playlistId", "resolution", "orientation", "status", "settings"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  if (body.heartbeat) {
    patch.status = "online";
    patch.lastSeen = new Date();
  }
  const rows = await db.update(displays).set(patch as never).where(eq(displays.id, id)).returning();
  return NextResponse.json({ display: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(displays).where(eq(displays.id, id));
  return NextResponse.json({ ok: true });
}
