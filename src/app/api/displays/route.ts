import { NextResponse } from "next/server";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function code() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function GET() {
  try {
    const rows = await db.select().from(displays).orderBy(desc(displays.createdAt));
    return NextResponse.json({ displays: rows });
  } catch {
    return NextResponse.json({ displays: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db
    .insert(displays)
    .values({ name: body.name || "New display", location: body.location || "", playlistId: body.playlistId || null, resolution: body.resolution || "1920x1080", orientation: body.orientation || "landscape", status: "offline", pairingCode: code(), settings: body.settings || null } as never)
    .returning();
  return NextResponse.json({ display: rows[0] }, { status: 201 });
}
