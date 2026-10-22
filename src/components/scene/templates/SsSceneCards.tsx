import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, chips, columnCount, columnWidth, kit, radiusFor, rows, type Kit } from "./brandKit";

/**
 * Template "ss-scene-cards" — Smart & Secure · Smart Scenes.
 *
 * A grid of smart-home scenes ("Good Morning", "Movie Night"…). Each card is a
 * soft-edged photo tile with the triggers as chips underneath — the
 * "this is what a smart home actually does" board for a showroom wall.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "SMART & SECURE · SMART SCENES"
 * - headline       = the board title, e.g. "ONE TAP. THE WHOLE HOUSE."
 * - subheadline    = one line under the headline
 * - ctaText        = button bottom-right, e.g. "SEE IT IN THE SHOWROOM"
 * - highlightColor = second accent (the trigger chips)
 * - items[]        = the scenes, up to six:
 *   - name  = the scene, e.g. "Good morning"
 *   - desc  = what happens, e.g. "Blinds up, lights warm, radio on"
 *   - tag   = when it fires, e.g. "7:00AM"
 *   - image = optional photo of the room
 * Not used: imageUrl, productName, description, prices.
 */

const GAP = 22;

function Card({
  k,
  d,
  i,
  item,
  w,
  h,
  cols,
}: {
  k: Kit;
  d: TemplateProps["d"];
  i: number;
  item: { name: string; desc?: string; tag?: string; image?: string };
  w: number;
  h: number | string;
  cols: number;
}) {
  const triggers = chips(item.desc, 3);
  const photoH = Math.round((typeof h === "number" ? h : 380) * 0.46);
  const namePx = fitPx(item.name, w - 40, cols > 3 ? 34 : 42, 22);
  const radius = radiusFor(w);

  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        flex: "none",
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        background: alpha(k.text, k.dark ? 0.06 : 0.035),
        border: `1px solid ${k.line}`,
        borderRadius: radius,
        overflow: "hidden",
        padding: 14,
        gap: 12,
        animationDelay: `${150 + d.s * (2 + i)}ms`,
      }}
    >
      <Frame src={item.image} alt={item.name} w="100%" h={photoH} k={k} radius={radius - 6} fit="cover" />
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 8, padding: "2px 6px 6px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <span style={{ flex: "1 1 auto", fontSize: namePx, fontWeight: 900, lineHeight: 1.08, color: k.text, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{item.name}</span>
          {item.tag ? (
            <span style={{ flex: "none", fontSize: 18, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: k.accent, whiteSpace: "nowrap" }}>{item.tag}</span>
          ) : null}
        </div>
        <div style={{ flex: "1 1 auto", display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 7 }}>
          {triggers.map((t, j) => (
            <span
              key={j}
              style={{
                fontSize: 17,
                fontWeight: 800,
                padding: "5px 12px",
                borderRadius: 999,
                background: alpha(k.accent2, k.dark ? 0.26 : 0.18),
                color: k.accent2,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SsSceneCardsTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 6);
  const cols = columnCount(items.length || 3);
  const totalW = 1920 - MARGIN * 2;
  const w = columnWidth(totalW, cols, GAP);
  // two rows when there are more cards than columns
  const rowCount = Math.ceil((items.length || cols) / cols);
  const cardH = rowCount > 1 ? "calc((100% - 22px) / 2)" : "100%";

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 24 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexWrap: "wrap", gap: GAP, alignContent: "stretch" }}>
        {items.length ? (
          items.map((it, i) => <Card key={i} k={k} d={d} i={i} item={it} w={w} h={cardH} cols={cols} />)
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: k.muted }}>
            <BrandIcon id="bulb" size={34} color={k.muted} />
            Add up to six scenes in the editor — one row per scene.
          </div>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
        <CtaBar scene={scene} d={d} k={k} i={8} width={720} />
      </div>
    </div>
  );
}
