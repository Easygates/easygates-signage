import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistItems, scenes, displays, schedules } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { rowToScene } from "@/lib/server";
import { DEMO_SCENES } from "@/lib/signage";
import { loadBrand } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Resolve what a display should play right now.
 *  ?displayId= — picks the display's playlist, overridden by an active schedule
 *  ?playlistId= — plays that playlist directly (preview / pairing)
 *  Falls back to the demo campaign when the DB is empty; on a DB error it answers 503 (screens keep playing).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const displayId = searchParams.get("displayId");
  const playlistIdParam = searchParams.get("playlistId");
  const { brand } = await loadBrand();

  try {
    let playlistId: string | null = playlistIdParam;
    let display = null;

    if (displayId) {
      const d = await db.select().from(displays).where(eq(displays.id, displayId)).limit(1);
      display = d[0] || null;
      if (display) {
        await db.update(displays).set({ status: "online", lastSeen: new Date() } as never).where(eq(displays.id, displayId));
        playlistId = display.playlistId;
        // schedule override: enabled schedule matching today + time window wins by priority,
        // evaluated in the business time zone so UK schedules stay right in summer.
        const { day, hhmm } = scheduleNow(brand.timezone);
        const all = await db.select().from(schedules).where(and(eq(schedules.enabled, true)));
        const cands = all.filter((s) => {
          if (s.displayId && s.displayId !== displayId) return false;
          if (s.days && !s.days.split(",").includes(day)) return false;
          if (s.startTime && hhmm < s.startTime) return false;
          if (s.endTime && hhmm > s.endTime) return false;
          return true;
        });
        cands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        if (cands[0]) playlistId = cands[0].playlistId;
      }
    }

    if (playlistId) {
      const p = await db.select().from(playlists).where(eq(playlists.id, playlistId)).limit(1);
      if (!p[0]) return NextResponse.json({ brand, mode: "demo", playlist: { id: "demo", name: "Demo", scenes: DEMO_SCENES }, scenes: DEMO_SCENES });
      const items = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId)).orderBy(asc(playlistItems.position));
      const ids = items.map((i) => i.sceneId);
      const byId = new Map();
      if (ids.length) {
        const rows = await db.select().from(scenes).where(inArray(scenes.id, ids));
        for (const r of rows) byId.set(r.id, rowToScene(r));
      }
      const resolved = items
        .map((i) => {
          const s = byId.get(i.sceneId);
          if (!s) return null;
          return { ...s, durationSec: i.durationOverride || s.durationSec, transition: (i.transitionOverride as never) || s.transition };
        })
        .filter(Boolean);
      return NextResponse.json({
        brand,
        mode: "playlist",
        playlist: { id: p[0].id, name: p[0].name, description: p[0].description, loop: p[0].loop, items },
        scenes: resolved.length ? resolved : DEMO_SCENES,
        display,
        fetchedAt: new Date().toISOString(),
      });
    }

    // No playlist selected → first playlist, else demo
    const all = await db.select().from(playlists).limit(1);
    if (!all[0]) return NextResponse.json({ brand, mode: "demo", playlist: { id: "demo", name: "NOVA MART Demo", scenes: DEMO_SCENES }, scenes: DEMO_SCENES });
    playlistId = all[0].id;
    const p2 = await db.select().from(playlists).where(eq(playlists.id, playlistId)).limit(1);
    const items2 = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId)).orderBy(asc(playlistItems.position));
    const ids2 = items2.map((i) => i.sceneId);
    const byId2 = new Map();
    if (ids2.length) {
      const rows = await db.select().from(scenes).where(inArray(scenes.id, ids2));
      for (const r of rows) byId2.set(r.id, rowToScene(r));
    }
    const resolved2 = items2
      .map((i) => {
        const s = byId2.get(i.sceneId);
        if (!s) return null;
        return { ...s, durationSec: i.durationOverride || s.durationSec, transition: (i.transitionOverride as never) || s.transition };
      })
      .filter(Boolean);
    return NextResponse.json({ brand, mode: "playlist", playlist: { id: p2[0].id, name: p2[0].name, description: p2[0].description, loop: p2[0].loop, items: items2 }, scenes: resolved2.length ? resolved2 : DEMO_SCENES, display, fetchedAt: new Date().toISOString() });
  } catch (e) {
    // A database ERROR (down, or the schema is out of date) must not blank the shop screens: answer
    // 503 so the screen keeps playing what it already has. (An empty database still gets the demo above.)
    console.error("player: database error", e);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}

/** Wall-clock day (0=Sun..6=Sat) and HH:MM in the business time zone. */
function scheduleNow(timezone: string | undefined): { day: string; hhmm: string } {
  const tz = timezone || "Europe/London";
  // toLocaleString renders the wall clock in tz; parsing it as a local Date
  // turns that wall clock into getDay()/getHours() in tz.
  const local = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const day = String(local.getDay());
  const hhmm = `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
  return { day, hhmm };
}
