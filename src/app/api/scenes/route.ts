import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenes } from "@/db/schema";
import { desc } from "drizzle-orm";
import { rowToScene, sceneToRow } from "@/lib/server";
import { TEMPLATES } from "@/lib/signage";

export const dynamic = "force-dynamic";

const VALID_TEMPLATES = new Set(TEMPLATES.map((t) => t.id));

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
  try {
    const body = await req.json();
    if (body.template && !VALID_TEMPLATES.has(body.template)) {
      return NextResponse.json({ error: `unknown template: ${body.template}` }, { status: 400 });
    }
    const payload = sceneToRow({ ...body, name: body.name || "Untitled scene" });
    const rows = await db.insert(scenes).values(payload as never).returning();
    return NextResponse.json({ scene: rowToScene(rows[0]) }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error && (e as { message: string }).message.includes("DATABASE_URL") ? "db-unavailable" : "db-unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
