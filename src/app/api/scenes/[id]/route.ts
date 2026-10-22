import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rowToScene, sceneToRow } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const payload = sceneToRow(body);
    // strip undefined so partial updates don't null everything unintentionally
    const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
    const rows = await db.update(scenes).set(clean as never).where(eq(scenes.id, id)).returning();
    if (!rows[0]) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ scene: rowToScene(rows[0]) });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(scenes).where(eq(scenes.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
