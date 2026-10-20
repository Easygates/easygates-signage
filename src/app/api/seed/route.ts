import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, displays, playlistItems, playlists, scenes, schedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEMO_SCENES } from "@/lib/signage";
import { sceneToRow } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST() {
  // idempotent-ish: skip scenes whose demo name already exists
  const existing = await db.select({ name: scenes.name }).from(scenes);
  const have = new Set(existing.map((r) => r.name));
  const created: string[] = [];
  for (const s of DEMO_SCENES) {
    if (have.has(s.name)) continue;
    const payload = sceneToRow(s);
    const rows = await db.insert(scenes).values({ ...payload, name: s.name, template: s.template } as never).returning();
    created.push(rows[0].id);
  }
  // ensure playlist exists
  let pl = await db.select().from(playlists).limit(1);
  let playlistId: string;
  if (!pl[0]) {
    const r = await db.insert(playlists).values({ name: "NOVA MART · Winter Sale Event", description: "8-scene demo covering all 7 templates", loop: true } as never).returning();
    playlistId = r[0].id;
  } else {
    playlistId = pl[0].id;
  }
  // attach any missing demo scenes in order
  const allScenes = await db.select().from(scenes);
  const demoRows = DEMO_SCENES.map((d) => allScenes.find((r) => r.name === d.name)).filter(Boolean) as typeof allScenes;
  const cur = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId));
  const haveScene = new Set(cur.map((i) => i.sceneId));
  let pos = cur.length;
  for (const r of demoRows) {
    if (haveScene.has(r.id)) continue;
    await db.insert(playlistItems).values({ playlistId, sceneId: r.id, position: pos++ } as never);
  }
  // seed assets + a display + a schedule for multi-display demo
  const aCount = await db.select().from(assets).limit(1);
  if (!aCount[0]) {
    for (const s of DEMO_SCENES.slice(0, 4)) {
      if (s.imageUrl) await db.insert(assets).values({ name: s.productName || s.name, url: s.imageUrl, type: "image" } as never);
    }
  }
  const dCount = await db.select().from(displays).limit(1);
  if (!dCount[0]) {
    await db.insert(displays).values([
      { name: "Entrance TV · 55in", location: "Store entrance", playlistId, resolution: "1920x1080", orientation: "landscape", status: "offline", pairingCode: "NOVA" },
      { name: "Café Menu Board", location: "Café counter", playlistId, resolution: "1920x1080", orientation: "landscape", status: "offline", pairingCode: "CAFE" },
    ] as never);
  }
  const sCount = await db.select().from(schedules).limit(1);
  if (!sCount[0]) {
    await db.insert(schedules).values({ name: "Daytime trading", playlistId, days: "1,2,3,4,5,6,0", startTime: "09:00", endTime: "21:00", priority: 0, enabled: true } as never);
  }
  return NextResponse.json({ ok: true, created: created.length, playlistId });
}
