import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/** Serves files written to public/uploads at runtime (local-disk fallback when
 *  Supabase Storage is not configured). next start only serves files that
 *  existed at build time, so uploads need this route (or Storage). */
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  txt: "text/plain",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const filePath = path.resolve(ROOT, ...parts);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const buf = await readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return new NextResponse(buf, {
    headers: {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": "public, max-age=3600",
    },
  });
}
