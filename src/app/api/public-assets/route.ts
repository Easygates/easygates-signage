import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Scans public/ subdirectories (seasonal, retail, trade) for image files
 * so they appear in the media library / quick-set pickers without needing
 * a database entry. Read-only — these files live on disk, not in the assets table.
 */
const PUBLIC_DIRS = ["seasonal", "retail", "trade", "uploads"];
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
