import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, displays, playlistItems, playlists, scenes, schedules } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  CORPORATE_DEMO_SCENES,
  COUNTER_DEMO_SCENES,
  DEMO_SCENES,
  EASYGATES_DEMO_SCENES,
  SMARTSECURE_DEMO_SCENES,
  TRADE_DEMO_SCENES,
  VALUE_DEMO_SCENES,
} from "@/lib/signage";
import { sceneToRow } from "@/lib/server";
import type { Scene } from "@/lib/signage";

export const dynamic = "force-dynamic";

type Campaign = "retail" | "trade" | "value" | "corporate" | "counter" | "easygates" | "smartsecure";

const CAMPAIGNS = {
  retail: {
    scenes: DEMO_SCENES,
    playlistName: "NOVA MART · Winter Sale Event",
    description: "8-scene retail campaign covering the retail templates",
    scheduleName: "Daytime trading",
    displays: [
      { name: "Entrance TV · 55in", location: "Store entrance", pairingCode: "NOVA" },
      { name: "Café Menu Board", location: "Café counter", pairingCode: "CAFE" },
    ],
  },
  trade: {
    scenes: TRADE_DEMO_SCENES,
    playlistName: "APEX · Electrical, Smart Home & Gates",
    description: "7-scene trade campaign: gate automation, smart home, upfront prices, welcome screen",
    scheduleName: "Opening hours",
    displays: [
      { name: "01 · Showroom window", location: "Front window", pairingCode: "WIND" },
      { name: "02 · Gate display", location: "Gate & barrier bay", pairingCode: "GATE" },
      { name: "03 · Smart home wall", location: "Demo wall", pairingCode: "SMAR" },
      { name: "04 · Trade counter", location: "Trade counter", pairingCode: "TRDE" },
      { name: "05 · Workshop", location: "Workshop / loading bay", pairingCode: "WORK" },
    ],
  },
  value: {
    scenes: VALUE_DEMO_SCENES,
    playlistName: "Value Store · Seasonal Savings",
    description: "12-scene value retail campaign covering all 7 templates with seasonal themes",
    scheduleName: "Daytime trading",
    displays: [
      { name: "Value Store · Entrance TV", location: "Store entrance", pairingCode: "VALU" },
      { name: "Value Store · Aisle Sign", location: "Aisle end-cap", pairingCode: "VCAF" },
    ],
  },
  counter: {
    scenes: COUNTER_DEMO_SCENES,
    playlistName: "RAPIDFIX · Trade Counter Deals",
    description: "5-scene trade-counter campaign covering the five Screwfix-style retail templates",
    scheduleName: "Trade counter hours",
    displays: [
      { name: "Trade Counter · Counter TV", location: "Trade counter", pairingCode: "RAPD" },
      { name: "Trade Counter · Warehouse", location: "Warehouse / loading bay", pairingCode: "RAPW" },
    ],
  },
  easygates: {
    scenes: EASYGATES_DEMO_SCENES,
    playlistName: "EasyGates Direct · Trade Counter",
    description: "6-scene EasyGates Direct campaign: gate kits, safety compliance, trade tiers, delivery, product choice and support",
    scheduleName: "Trade counter hours",
    displays: [
      { name: "EasyGates · Trade counter TV", location: "Trade counter", pairingCode: "EGTC" },
      { name: "EasyGates · Workshop", location: "Workshop / stores", pairingCode: "EGWS" },
      { name: "EasyGates · Showroom", location: "Gate display bay", pairingCode: "EGSR" },
    ],
  },
  smartsecure: {
    scenes: SMARTSECURE_DEMO_SCENES,
    playlistName: "Smart & Secure · Showroom",
    description: "6-scene Smart & Secure campaign: zone guide, smart scenes, security packages, compatibility, bookings and product spotlight",
    scheduleName: "Showroom opening hours",
    displays: [
      { name: "Smart & Secure · Showroom TV", location: "Showroom entrance", pairingCode: "SSTV" },
      { name: "Smart & Secure · Cinema room", location: "Home cinema demo", pairingCode: "SSCR" },
      { name: "Smart & Secure · Consultation", location: "Design desk", pairingCode: "SSDS" },
    ],
  },
  corporate: {
    scenes: CORPORATE_DEMO_SCENES,
    playlistName: "Easygates · Head Office & Reception",
    description: "7-scene corporate campaign: values, team, milestone, news, testimonial, ambient background and Trustpilot review",
    scheduleName: "Office hours",
    displays: [
      { name: "Reception TV", location: "Reception / lobby", pairingCode: "RECP" },
      { name: "Office Screen", location: "Staff office", pairingCode: "OFFC" },
    ],
  },
} satisfies Record<Campaign, { scenes: Scene[]; playlistName: string; description: string; scheduleName: string; displays: { name: string; location: string; pairingCode: string }[] }>;

async function campaignFrom(req: Request): Promise<Campaign> {
  const q = new URL(req.url).searchParams.get("campaign");
  if (q === "trade" || q === "retail" || q === "value" || q === "corporate" || q === "counter" || q === "easygates" || q === "smartsecure") return q;
  try {
    const body = await req.json();
    if (body?.campaign === "trade" || body?.campaign === "retail" || body?.campaign === "value" || body?.campaign === "corporate" || body?.campaign === "counter" || body?.campaign === "easygates" || body?.campaign === "smartsecure") return body.campaign;
  } catch {
    /* no body */
  }
  return "retail";
}

export async function POST(req: Request) {
  try {
    const campaign = await campaignFrom(req);
    const cfg = CAMPAIGNS[campaign];

    // ── scenes (idempotent by name) ──
    const existing = await db.select({ name: scenes.name }).from(scenes);
    const have = new Set(existing.map((r) => r.name));
    const created: string[] = [];
    for (const s of cfg.scenes) {
      if (have.has(s.name)) continue;
      const payload = sceneToRow(s);
      const rows = await db.insert(scenes).values({ ...payload, name: s.name, template: s.template } as never).returning();
      created.push(rows[0].id);
    }

    // ── playlist for this campaign ──
    const pl = await db.select().from(playlists).where(eq(playlists.name, cfg.playlistName)).limit(1);
    let playlistId: string;
    if (pl[0]) {
      playlistId = pl[0].id;
    } else {
      const r = await db.insert(playlists).values({ name: cfg.playlistName, description: cfg.description, loop: true } as never).returning();
      playlistId = r[0].id;
    }

    // ── attach missing scenes in campaign order ──
    const allScenes = await db.select().from(scenes);
    const campaignRows = cfg.scenes
      .map((d) => allScenes.find((r) => r.name === d.name))
      .filter(Boolean) as typeof allScenes;
    const cur = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId));
    const haveScene = new Set(cur.map((i) => i.sceneId));
    let pos = cur.length;
    for (const r of campaignRows) {
      if (haveScene.has(r.id)) continue;
      await db.insert(playlistItems).values({ playlistId, sceneId: r.id, position: pos++ } as never);
    }

    // ── media library (by URL, so re-running never duplicates) ──
    const existingAssets = await db.select({ url: assets.url }).from(assets);
    const haveAsset = new Set(existingAssets.map((a) => a.url));
    for (const s of cfg.scenes) {
      if (!s.imageUrl || haveAsset.has(s.imageUrl)) continue;
      haveAsset.add(s.imageUrl);
      await db.insert(assets).values({ name: s.productName || s.name, url: s.imageUrl, type: "image" } as never);
    }

    // ── displays (one per TV, idempotent by name) ──
    const existingDisplays = await db.select({ name: displays.name }).from(displays);
    const haveDisplay = new Set(existingDisplays.map((d) => d.name));
    const newDisplays = cfg.displays.filter((d) => !haveDisplay.has(d.name));
    if (newDisplays.length) {
      await db.insert(displays).values(
        newDisplays.map((d) => ({
          ...d,
          playlistId,
          resolution: "1920x1080",
          orientation: "landscape",
          status: "offline",
        })) as never
      );
    }

    // ── schedule demo ──
    // Bound to one display on purpose: a display-less schedule overrides EVERY screen,
    // which would make the second demo campaign hijack the first one's playlist.
    const sCount = await db.select().from(schedules).limit(1);
    if (!sCount[0]) {
      const schedDisplay = await db.select().from(displays).where(eq(displays.name, cfg.displays[0].name)).limit(1);
      await db.insert(schedules).values({
        name: cfg.scheduleName,
        playlistId,
        displayId: schedDisplay[0]?.id ?? null,
        days: "1,2,3,4,5,6,0",
        startTime: "08:30",
        endTime: "18:00",
        priority: 0,
        enabled: true,
      } as never);
    }

    return NextResponse.json({
      ok: true,
      campaign,
      created: created.length,
      playlistId,
      playlistName: cfg.playlistName,
      // slides now in the playlist (not just the ones created on this run)
      scenes: campaignRows.length,
      displays: cfg.displays.length,
    });
  } catch (e) {
    console.error("seed failed", e);
    return NextResponse.json({ error: "db-unavailable — run supabase/schema.sql and check DATABASE_URL" }, { status: 503 });
  }
}
