import { NextResponse } from "next/server";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(schedules).orderBy(desc(schedules.createdAt));
    return NextResponse.json({ schedules: rows });
  } catch {
    return NextResponse.json({ schedules: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.playlistId) return NextResponse.json({ error: "playlistId required" }, { status: 400 });
  const rows = await db
    .insert(schedules)
    .values({ name: body.name || "New schedule", playlistId: body.playlistId, displayId: body.displayId || null, days: body.days || "1,2,3,4,5,6,0", startTime: body.startTime || "09:00", endTime: body.endTime || "21:00", priority: body.priority ?? 0, enabled: body.enabled ?? true } as never)
    .returning();
  return NextResponse.json({ schedule: rows[0] }, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "playlistId", "displayId", "days", "startTime", "endTime", "priority", "enabled"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const rows = await db.update(schedules).set(patch as never).where(eq(schedules.id, body.id)).returning();
  return NextResponse.json({ schedule: rows[0] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await db.delete(schedules).where(eq(schedules.id, id));
  return NextResponse.json({ ok: true });
}
