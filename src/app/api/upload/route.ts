import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { assets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
  ];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "unsupported type (jpg/png/webp/gif/mp4/webm)" },
      { status: 400 }
    );
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "max 25 MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "signage-media";

  let url = "";
  let storageBackend = "local-disk";

  if (supabaseUrl && serviceKey) {
    // Upload directly to Supabase Storage public bucket
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${safe}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: buf,
      }
    );
    if (!uploadRes.ok) {
      const detail = await uploadRes.text().catch(() => "upload-failed");
      return NextResponse.json(
        {
          error: `Supabase Storage error (${uploadRes.status}): ensure public bucket "${bucket}" exists`,
          detail,
        },
        { status: 502 }
      );
    }
    url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${safe}`;
    storageBackend = "supabase-storage";
  } else {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safe), buf);
    url = `/uploads/${safe}`;
  }

  try {
    const rows = await db
      .insert(assets)
      .values({
        name: file.name,
        url,
        type: file.type.startsWith("video") ? "video" : "image",
        mime: file.type,
        sizeBytes: file.size,
      } as never)
      .returning();
    return NextResponse.json(
      { asset: rows[0], storageBackend },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ url, name: file.name, storageBackend });
  }
}
