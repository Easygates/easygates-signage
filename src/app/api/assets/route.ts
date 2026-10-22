import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(assets).orderBy(desc(assets.createdAt)).limit(200);
    return NextResponse.json({ assets: rows });
  } catch {
    return NextResponse.json({ assets: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.url || !body.name) return NextResponse.json({ error: "name + url required" }, { status: 400 });
    const rows = await db
      .insert(assets)
      .values({ name: body.name, url: body.url, type: body.type || "image", mime: body.mime || null, sizeBytes: body.sizeBytes || null, width: body.width || null, height: body.height || null } as never)
      .returning();
    return NextResponse.json({ asset: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
