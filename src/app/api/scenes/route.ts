import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenes } from "@/db/schema";
import { desc } from "drizzle-orm";
import { rowToScene, sceneToRow } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(scenes).orderBy(desc(scenes.createdAt));
    return NextResponse.json({ scenes: rows.map(rowToScene) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ scenes: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const payload = sceneToRow({ ...body, name: body.name || "Untitled scene" });
  const rows = await db.insert(scenes).values(payload as never).returning();
  return NextResponse.json({ scene: rowToScene(rows[0]) }, { status: 201 });
}
