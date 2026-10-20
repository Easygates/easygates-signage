import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { secretKeyProblem, supabaseAuthHeaders, supabaseStorageConfig } from "@/lib/supabase";

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

  const storage = supabaseStorageConfig();

  let url = "";
  let storageBackend = "local-disk";

  if (storage) {
    const { url: supabaseUrl, key, bucket } = storage;
    const keyProblem = secretKeyProblem(key);
    if (keyProblem) {
      return NextResponse.json({ error: keyProblem }, { status: 500 });
    }
    // Upload directly to Supabase Storage public bucket
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${safe}`,
      {
        method: "POST",
        headers: {
          ...supabaseAuthHeaders(key),
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: buf,
      }
    );
    if (!uploadRes.ok) {
      const detail = await uploadRes.text().catch(() => "upload-failed");
      let message = "";
      try {
        message = String(JSON.parse(detail).message || "");
      } catch {
        message = detail.slice(0, 200);
      }
      const hint = /bucket not found/i.test(message)
        ? ` — create public bucket "${bucket}" (run supabase/schema.sql)`
        : /row-level security/i.test(message)
          ? " — SUPABASE_SECRET_KEY must be the secret key (sb_secret_…), not the publishable/anon key"
          : /authorization|invalid|signature|jwt/i.test(message)
            ? " — Supabase didn't accept SUPABASE_SECRET_KEY; copy it again from Project Settings → API Keys"
            : "";
      return NextResponse.json(
        {
          error: `Supabase Storage error (${uploadRes.status}): ${message || "upload failed"}${hint}`,
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
