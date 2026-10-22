import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { secretKeyProblem, supabaseAuthHeaders, supabaseStorageConfig } from "@/lib/supabase";

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

/**
 * Permanently deletes one asset-library entry (by ?id=) and best-effort removes
 * its backing file: local uploads from public/uploads/, Supabase Storage
 * objects when configured. External/remote URLs only lose their DB entry.
 */
export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const rows = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
    const assetUrl = rows[0].url;

    await db.delete(assets).where(eq(assets.id, id));

    // best-effort backing-file cleanup — never fail the delete over this
    try {
      const local = assetUrl.match(/^\/(?:api\/)?uploads\/(.+)$/);
      if (local) {
        await unlink(path.join(process.cwd(), "public", "uploads", path.basename(local[1])));
      } else if (assetUrl.includes("/storage/v1/object/public/")) {
        const storage = supabaseStorageConfig();
        if (storage && !secretKeyProblem(storage.key)) {
          const objectPath = assetUrl.split(`/storage/v1/object/public/${storage.bucket}/`)[1];
          if (objectPath) {
            await fetch(`${storage.url}/storage/v1/object/${storage.bucket}`, {
              method: "DELETE",
              headers: { ...supabaseAuthHeaders(storage.key), "Content-Type": "application/json" },
              body: JSON.stringify({ prefixes: [objectPath] }),
            });
          }
        }
      }
    } catch {
      /* file may already be gone — the library entry is deleted either way */
    }

    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: "db-unavailable" }, { status: 503 });
  }
}
