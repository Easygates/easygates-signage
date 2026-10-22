import { NextResponse } from "next/server";
import {
  buildTimeline,
  CORPORATE_DEMO_SCENES,
  COUNTER_DEMO_SCENES,
  DEMO_SCENES,
  EASYGATES_DEMO_SCENES,
  ITEM_TEMPLATES,
  SMARTSECURE_DEMO_SCENES,
  TEMPLATES,
  TRADE_DEMO_SCENES,
  VALUE_DEMO_SCENES,
} from "@/lib/signage";

export const dynamic = "force-dynamic";

// Templates that must carry a hero image
const IMAGE_TEMPLATES = new Set([
  "retail-promo",
  "food-menu",
  "product-showcase",
  "product-grid",
  "fullscreen-campaign",
  "split-promo",
  "service-offer",
  "product-spec",
  "callout-emergency",
  "bulk-buy",
  "click-collect",
  "eg-kit-builder",
  "eg-delivery-cutoff",
  "eg-support-hub",
  "ss-book-demo",
  "ss-product-spotlight",
]);

export async function GET() {
  const checks: { name: string; pass: boolean; detail?: string }[] = [];
  const ids = new Set(TEMPLATES.map((t) => t.id));
  const itemTemplates = new Set<string>(ITEM_TEMPLATES);
  const all = [
    ...DEMO_SCENES,
    ...TRADE_DEMO_SCENES,
    ...VALUE_DEMO_SCENES,
    ...CORPORATE_DEMO_SCENES,
    ...COUNTER_DEMO_SCENES,
    ...EASYGATES_DEMO_SCENES,
    ...SMARTSECURE_DEMO_SCENES,
  ];

  checks.push({
    name: `template catalogue has ${TEMPLATES.length} entries with unique ids`,
    pass: TEMPLATES.length === ids.size && ids.size === new Set(TEMPLATES.map((t) => t.id)).size,
  });

  for (const s of all) {
    checks.push({ name: `scene "${s.name}" uses known template`, pass: ids.has(s.template) });
  }

  const covered = new Set(all.map((s) => s.template));
  const missing = TEMPLATES.map((t) => t.id).filter((id) => !covered.has(id));
  checks.push({
    name: `demo campaigns cover all ${TEMPLATES.length} templates`,
    pass: missing.length === 0,
    detail: missing.length ? `missing: ${missing.join(", ")}` : undefined,
  });

  for (const s of all) {
    const tl = buildTimeline(s);
    const ordered = tl.every((v, i, a) => i === 0 || v.atMs >= a[i - 1].atMs);
    const hasExit = tl.some((v) => v.key === "exit");
    checks.push({ name: `timeline "${s.name}" ordered + has exit`, pass: ordered && hasExit && tl.length === 10 });
    checks.push({ name: `scene "${s.name}" duration 6–20s`, pass: s.durationSec >= 6 && s.durationSec <= 20 });
    if (IMAGE_TEMPLATES.has(s.template)) {
      checks.push({ name: `scene "${s.name}" has image`, pass: !!s.imageUrl });
    }
    if (itemTemplates.has(s.template)) {
      checks.push({ name: `scene "${s.name}" has rows for its template`, pass: (s.items || []).length > 0 });
    }
  }

  const pass = checks.every((c) => c.pass);
  return NextResponse.json({ pass, checks, count: checks.length });
}
