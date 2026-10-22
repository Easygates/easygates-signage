import { NextResponse } from "next/server";
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Scans public/ subdirectories (seasonal, retail, trade, ambient, uploads)
 * for image files so they appear in the media library / quick-set pickers
 * without needing a database entry. These files live on disk, not in the
 * assets table — GET lists them, DELETE physically removes one file.
 */
const PUBLIC_DIRS = ["seasonal", "retail", "trade", "ambient", "uploads"];
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const assets: { id: string; name: string; url: string; type: string; source: string }[] = [];

    for (const dir of PUBLIC_DIRS) {
      const fullDir = path.join(publicDir, dir);
      let entries: string[];
      try {
        entries = await readdir(fullDir);
      } catch {
        continue; // directory doesn't exist yet (e.g. uploads before first upload)
      }
      for (const entry of entries) {
        // skip subdirectories and non-images
        const ext = path.extname(entry).toLowerCase();
        if (!IMAGE_EXT.has(ext)) continue;
        const url = `/${dir}/${entry}`;
        assets.push({
          id: `public-${dir}-${entry}`,
          name: entry.replace(/\.[^/.]+$/, ""),
          url,
          type: "image",
          source: "public",
        });
      }
    }

    assets.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ assets });
  } catch {
    return NextResponse.json({ assets: [] });
  }
}

/**
 * Permanently removes one public/ image file from disk.
 * Query: ?url=/<dir>/<file> where <dir> must be one of PUBLIC_DIRS.
 * Strictly validated so nothing outside the listed public/ subfolders can be touched.
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url") || "";
    const parts = url.split("/").filter(Boolean);
    if (parts.length !== 2) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }
    const [dir, file] = parts;
    if (!PUBLIC_DIRS.includes(dir) || !IMAGE_EXT.has(path.extname(file).toLowerCase())) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }
    const base = path.join(process.cwd(), "public", dir);
    const target = path.resolve(base, path.basename(file));
    // belt-and-braces: resolved path must stay inside the allowed directory
    if (!target.startsWith(base + path.sep)) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }
    await unlink(target);
    return NextResponse.json({ deleted: true, url });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return NextResponse.json({ error: "file not found" }, { status: 404 });
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
