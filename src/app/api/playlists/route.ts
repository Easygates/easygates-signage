import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems, scenes } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { rowToScene } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pls = await db.select().from(playlists).orderBy(desc(playlists.createdAt));
    const out = [];
    for (const p of pls) {
      const items = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, p.id)).orderBy(asc(playlistItems.position));
      const sceneIds = items.map((i) => i.sceneId);
      let sceneList: Record<string, unknown>[] = [];
      if (sceneIds.length) {
        const { inArray } = await import("drizzle-orm");
        const rows = await db.select().from(scenes).where(inArray(scenes.id, sceneIds));
        const byId = new Map<string, ReturnType<typeof rowToScene>>(rows.map((r) => [r.id, rowToScene(r)]));
        const mapped: Record<string, unknown>[] = [];
        for (const i of items) {
          const base = byId.get(i.sceneId);
          if (!base) continue;
          mapped.push({ ...base, _itemId: i.id, _durationOverride: i.durationOverride, _transitionOverride: i.transitionOverride });
        }
        sceneList = mapped;
      }
      out.push({ ...p, items, scenes: sceneList });
    }
    return NextResponse.json({ playlists: out });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ playlists: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = await db.insert(playlists).values({ name: body.name || "New playlist", description: body.description || "", loop: body.loop ?? true } as never).returning();
    return NextResponse.json({ playlist: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
