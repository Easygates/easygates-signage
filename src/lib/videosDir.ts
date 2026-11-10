import path from "node:path";

/**
 * Where the server keeps its videos: `public/videos` inside the project, or the folder named by the
 * VIDEOS_DIR setting in .env (handy for a big drive, e.g. VIDEOS_DIR="D:\Videos"). `label` is what the
 * editor shows to the user — the project-relative name, never the full path of the machine.
 */
export function videosDir(): { dir: string; label: string; custom: boolean } {
  const custom = (process.env.VIDEOS_DIR || "").trim();
  if (custom) return { dir: path.resolve(custom), label: "the VIDEOS_DIR folder", custom: true };
  return { dir: path.join(process.cwd(), "public", "videos"), label: "public/videos", custom: false };
}
