import { NextResponse } from "next/server";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { desc } from "drizzle-orm";
import { nextScreenNumber, parseScreenNumber } from "@/lib/screens";

export const dynamic = "force-dynamic";

function code() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

type DisplaySettings = Record<string, unknown> | null;

/** Never ship the player password to the browser — the control route reads it server-side. */
function redact(settings: DisplaySettings) {
  if (!settings) return { settings: null, hasFully: false, fullyUrl: "" };
  const { fullyPassword, ...rest } = settings as { fullyPassword?: unknown; fullyUrl?: unknown } & Record<string, unknown>;
  return {
    settings: rest as Record<string, unknown>,
    hasFully: Boolean(fullyPassword),
    fullyUrl: typeof rest.fullyUrl === "string" ? rest.fullyUrl : "",
  };
}

export async function GET() {
  try {
    const rows = await db.select().from(displays).orderBy(desc(displays.createdAt));
    return NextResponse.json({
      displays: rows.map((r) => ({ ...r, ...redact(r.settings as DisplaySettings) })),
    });
  } catch {
    return NextResponse.json({ displays: [], error: "db-unavailable" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // a new screen gets the lowest free screen number unless one is asked for
    const taken = await db.select({ n: displays.screenNumber }).from(displays);
    const asked = body.screenNumber === undefined ? null : parseScreenNumber(body.screenNumber);
    if (asked === undefined) return NextResponse.json({ error: "Screen number must be a whole number from 1 to 9999" }, { status: 400 });
    if (asked !== null && taken.some((t) => t.n === asked)) return NextResponse.json({ error: `Screen number ${asked} is already used` }, { status: 409 });
    const screenNumber = asked ?? nextScreenNumber(taken.map((t) => t.n));
    const rows = await db
      .insert(displays)
      .values({ screenNumber, name: body.name || "New display", location: body.location || "", playlistId: body.playlistId || null, resolution: body.resolution || "1920x1080", orientation: body.orientation || "landscape", status: "offline", pairingCode: code(), settings: body.settings || null } as never)
      .returning();
    return NextResponse.json({ display: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
