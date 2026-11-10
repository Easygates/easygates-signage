// The videos folder: files the shop keeps on the server and plays on the screens.
//
// Videos live in `public/videos` (or the folder named by the VIDEOS_DIR setting) and are served by
// /api/videos/<file> — read from disk on every request, so a file dropped into the folder shows up at
// once with no rebuild or restart, and with HTTP Range support so TVs can start playing quickly, loop,
// and skip around without downloading the whole file.
//
// Pure functions only (no imports), so `node --test` can load this file directly.

export const VIDEO_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
};

/** The Content-Type for a video file name, or null if it is not a video we serve. */
export function videoMime(name: string): string | null {
  const m = /\.[^./\\]+$/.exec(name.toLowerCase());
  return (m && VIDEO_TYPES[m[0]]) || null;
}

/**
 * A request path (the segments after /api/videos/) as a safe relative path inside the videos folder,
 * or null. Refuses anything that could leave the folder or reach something that is not a video:
 * "..", empty parts, backslashes, drive letters, hidden files, and any extension we do not serve.
 */
export function cleanVideoPath(segments: string[]): string | null {
  if (!segments.length || segments.length > 6) return null;
  const parts: string[] = [];
  for (const raw of segments) {
    let seg = raw;
    try {
      seg = decodeURIComponent(raw);
    } catch {
      return null;
    }
    if (!seg || seg === "." || seg === ".." || seg.startsWith(".")) return null;
    if (/[\\/:*?"<>|\0]/.test(seg)) return null;
    parts.push(seg);
  }
  return videoMime(parts[parts.length - 1]) ? parts.join("/") : null;
}

/** The address a screen uses for a file in the videos folder ("clips/a b.mp4" → "/api/videos/clips/a%20b.mp4"). */
export function videoUrlFor(relativePath: string): string {
  return "/api/videos/" + relativePath.split("/").map(encodeURIComponent).join("/");
}

export type ByteRange = { start: number; end: number };

/**
 * Parse a Range header ("bytes=0-", "bytes=100-199", "bytes=-500") against a file of `size` bytes.
 * Returns the range, null when there is no usable range header (send the whole file), or "invalid"
 * when it cannot be satisfied (answer 416).
 */
export function parseRange(header: string | null | undefined, size: number): ByteRange | null | "invalid" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null; // multi-range or nonsense: ignore the header
  if (size <= 0) return "invalid";
  let start: number;
  let end: number;
  if (m[1] === "") {
    const tail = Number(m[2]); // "the last N bytes"
    if (!Number.isFinite(tail) || tail <= 0) return "invalid";
    start = Math.max(0, size - tail);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return "invalid";
  return { start, end };
}

/** Human size for the picker: 1234567 → "1.2 MB". */
export function prettySize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
