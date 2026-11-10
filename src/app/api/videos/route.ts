import { NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { cleanVideoPath, videoMime, videoUrlFor } from "@/lib/videoFiles";
import { videosDir } from "@/lib/videosDir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Entry = { name: string; path: string; url: string; size: number; modified: string };

/** Walk the videos folder (a few levels deep) and collect the playable files. */
async function walk(root: string, rel: string, depth: number, out: Entry[]): Promise<void> {
  let names: string[];
  try {
    names = await readdir(path.join(root, rel));
  } catch {
    return;
  }
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const childRel = rel ? `${rel}/${name}` : name;
    let info;
    try {
      info = await stat(path.join(root, childRel));
    } catch {
      continue;
    }
    if (info.isDirectory()) {
      if (depth < 3) await walk(root, childRel, depth + 1, out);
    } else if (info.isFile() && videoMime(name) && cleanVideoPath(childRel.split("/"))) {
      out.push({ name, path: childRel, url: videoUrlFor(childRel), size: info.size, modified: info.mtime.toISOString() });
    }
  }
}

/** The videos in the server's videos folder, for the "Videos folder" picker in the scene editor. */
export async function GET() {
  const { dir, label, custom } = videosDir();
  const videos: Entry[] = [];
  let missing = false;
  try {
    await stat(dir);
  } catch {
    missing = true;
  }
  if (!missing) await walk(dir, "", 0, videos);
  videos.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" }));
  return NextResponse.json({ videos, folder: label, custom, missing });
}
