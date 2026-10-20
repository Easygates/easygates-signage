import { NextResponse } from "next/server";
import { buildTimeline, DEMO_SCENES, TEMPLATES } from "@/lib/signage";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: { name: string; pass: boolean; detail?: string }[] = [];
  const ids = new Set(TEMPLATES.map((t) => t.id));
  for (const s of DEMO_SCENES) {
    checks.push({ name: `scene "${s.name}" uses known template`, pass: ids.has(s.template) });
  }
  checks.push({ name: "demo covers all 7 templates", pass: new Set(DEMO_SCENES.map((s) => s.template)).size === 7 });
  for (const s of DEMO_SCENES) {
    const tl = buildTimeline(s);
    const ordered = tl.every((v, i, a) => i === 0 || v.atMs >= a[i - 1].atMs);
    const hasExit = tl.some((v) => v.key === "exit");
    checks.push({ name: `timeline "${s.name}" ordered + has exit`, pass: ordered && hasExit && tl.length === 10 });
    checks.push({ name: `scene "${s.name}" duration 6–20s`, pass: s.durationSec >= 6 && s.durationSec <= 20 });
    checks.push({ name: `scene "${s.name}" has image`, pass: !!s.imageUrl });
  }
  const pass = checks.every((c) => c.pass);
  return NextResponse.json({ pass, checks, count: checks.length });
}
