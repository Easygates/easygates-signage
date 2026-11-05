import { NextResponse } from "next/server";
import { db } from "@/db";
import { displays } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { parseScreenNumber } from "@/lib/screens";

export const dynamic = "force-dynamic";

type DisplaySettings = Record<string, unknown> | null;

function redact(settings: DisplaySettings) {
  if (!settings) return { settings: null, hasFully: false, fullyUrl: "" };
  const { fullyPassword, ...rest } = settings as { fullyPassword?: unknown; fullyUrl?: unknown } & Record<string, unknown>;
  return {
    settings: rest as Record<string, unknown>,
    hasFully: Boolean(fullyPassword),
    fullyUrl: typeof rest.fullyUrl === "string" ? rest.fullyUrl : "",
  };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const k of ["name", "location", "playlistId", "resolution", "orientation", "status", "settings"]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    // Rename: a screen must keep a name; both are trimmed and kept to a sensible length.
    if (body.name !== undefined) {
      const name = String(body.name ?? "").trim().slice(0, 120);
      if (!name) return NextResponse.json({ error: "A screen needs a name" }, { status: 400 });
      patch.name = name;
    }
    if (body.location !== undefined) patch.location = String(body.location ?? "").trim().slice(0, 200);
    if (body.heartbeat) {
      patch.status = "online";
      patch.lastSeen = new Date();
    }

    // Screen number (?displayId=2): whole number 1–9999, unique, or empty to clear it.
    if (body.screenNumber !== undefined) {
      const n = parseScreenNumber(body.screenNumber);
      if (n === undefined) return NextResponse.json({ error: "Screen number must be a whole number from 1 to 9999, or empty" }, { status: 400 });
      if (n !== null) {
        const clash = await db
          .select({ name: displays.name })
          .from(displays)
          .where(and(eq(displays.screenNumber, n), ne(displays.id, id)))
          .limit(1);
        if (clash[0]) return NextResponse.json({ error: `Screen number ${n} is already used by "${clash[0].name}"` }, { status: 409 });
      }
      patch.screenNumber = n;
    }

    // Merge player settings instead of replacing them, so the stored password survives
    // a partial update (e.g. the admin only resends the URL).
    if (body.settings && typeof body.settings === "object") {
      const rows = await db.select({ settings: displays.settings }).from(displays).where(eq(displays.id, id)).limit(1);
      const current = (rows[0]?.settings as DisplaySettings) || {};
      const incoming = { ...(body.settings as Record<string, unknown>) };
      // A blank password field means "keep the existing one".
      if (!incoming.fullyPassword) delete incoming.fullyPassword;
      if (incoming.fullyPassword === "••••") delete incoming.fullyPassword;
      patch.settings = { ...current, ...incoming };
    }

    const rows = await db.update(displays).set(patch as never).where(eq(displays.id, id)).returning();
    if (!rows[0]) return NextResponse.json({ error: "Display not found" }, { status: 404 });
    return NextResponse.json({ display: { ...rows[0], ...redact(rows[0].settings as DisplaySettings) } });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(displays).where(eq(displays.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
