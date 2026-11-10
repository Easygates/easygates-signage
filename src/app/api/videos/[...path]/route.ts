import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { cleanVideoPath, parseRange, videoMime } from "@/lib/videoFiles";
import { videosDir } from "@/lib/videosDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serve one file from the videos folder, streamed from disk with HTTP Range support. TV browsers
 * ask for a video in pieces (and again every time it loops), so answering "206 Partial Content"
 * is what lets them start at once and loop without re-downloading everything. Public on purpose:
 * the screens need it without a login, and it only reads files inside the videos folder.
 */
async function serve(req: Request, params: Promise<{ path: string[] }>, headOnly: boolean): Promise<Response> {
  const { path: segments } = await params;
  const rel = cleanVideoPath(segments);
  const mime = rel ? videoMime(rel) : null;
  if (!rel || !mime) return new Response("Not found", { status: 404 });

  const root = videosDir().dir;
  const file = path.join(root, ...rel.split("/"));
  // belt and braces: whatever the name was, the file must still be inside the folder
  const inside = path.relative(root, file);
  if (inside.startsWith("..") || path.isAbsolute(inside)) return new Response("Not found", { status: 404 });

  let info;
  try {
    info = await stat(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!info.isFile()) return new Response("Not found", { status: 404 });

  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const base: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "Last-Modified": info.mtime.toUTCString(),
    ETag: etag,
    // check back every time (replacing a file keeps its name), but a 304 costs almost nothing
    "Cache-Control": "public, max-age=0, must-revalidate",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: base });

  const range = parseRange(req.headers.get("range"), info.size);
  if (range === "invalid") return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${info.size}` } });

  const start = range ? range.start : 0;
  const end = range ? range.end : Math.max(0, info.size - 1);
  const length = info.size === 0 ? 0 : end - start + 1;
  const headers = { ...base, "Content-Length": String(length), ...(range ? { "Content-Range": `bytes ${start}-${end}/${info.size}` } : {}) };
  if (headOnly || length === 0) return new Response(null, { status: range ? 206 : 200, headers });

  const stream = createReadStream(file, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status: range ? 206 : 200, headers });
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(req, ctx.params, false);
}

export async function HEAD(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(req, ctx.params, true);
}
