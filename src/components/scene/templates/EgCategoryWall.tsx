import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, Chip, CtaBar, Head, MARGIN, TOP, fitPx, rowIcon } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-category-wall" — EasyGates Direct · Shop by Category.
 *
 * The department wall of the trade counter: a grid of category tiles, each with
 * an icon picked from the category name (gate → gate, access control → key,
 * safety edges → shield) plus the line count and a couple of example products.
 * Four across on one row, or eight as a 4×2 wall.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "EASYGATES DIRECT · SHOP BY CATEGORY"
 * - headline    = the wall title, e.g. "EVERYTHING FOR THE GATE"
 * - subheadline = one line under the headline
 * - ctaText     = button bottom-right, e.g. "ASK AT THE COUNTER"
 * - items[]     = the categories, up to eight:
 *   - name = the category, e.g. "Gate automation"
 *   - desc = what is in it, e.g. "Motors, kits, rack, control panels"
 *   - tag  = optional chip, e.g. "1,200 LINES"
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

const COLS = 4;

function Tile({ k, i, name, desc, tag, w, h, compact }: { k: Kit; i: number; name: string; desc?: string; tag?: string; w: number; h: number | string; compact: boolean }) {
  const icon = rowIcon({ name, desc, tag }, i);
  const namePx = fitPx(name, w - 40, compact ? 30 : 40, 18, compact ? 2 : 2);
  const descPx = compact ? 19 : 23;
  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: compact ? "18px" : "24px 22px",
        borderRadius: 20,
        background: alpha(k.text, k.dark ? 0.05 : 0.03),
        border: `1px solid ${k.line}`,
        borderTop: `6px solid ${i % COLS === 1 ? k.solid2 : k.solid}`,
        overflow: "hidden",
        animationDelay: `${150 + i * 70}ms`,
      }}
    >
      <span style={{ flex: "none", display: "grid", placeItems: "center", width: compact ? 52 : 62, height: compact ? 52 : 62, borderRadius: 18, background: i % COLS === 1 ? k.solid2 : k.solid }}>
        <BrandIcon id={icon} size={compact ? 30 : 36} color={i % COLS === 1 ? k.solid2Ink : k.solidInk} stroke={2.4} />
      </span>
      <span style={{ flex: "1 1 auto", minHeight: 0 }}>
        <span style={{ display: "block", fontSize: namePx, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.01em", color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? (
          <span style={{ display: "block", marginTop: 6, fontSize: descPx, fontWeight: 600, lineHeight: 1.24, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span>
        ) : null}
      </span>
      {tag ? (
        <span style={{ flex: "none" }}>
          <Chip k={k} text={tag} fill={alpha(k.accent, 0.16)} ink={k.accent} px={17} />
        </span>
      ) : null}
    </div>
  );
}

export default function EgCategoryWallTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 8);
  const totalW = 1920 - MARGIN * 2;
  const gap = 20;
  const w = Math.floor((totalW - gap * (COLS - 1)) / COLS);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 20 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexWrap: "wrap", gap, alignContent: "stretch" }}>
        {items.length ? (
          items.map((it, i) => {
            const twoRows = items.length > COLS;
            const h = twoRows ? "calc(50% - 10px)" : "100%";
            return <Tile key={i} k={k} i={i} name={it.name} desc={it.desc} tag={it.tag} w={w} h={h} compact={twoRows} />;
          })
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add the categories in the editor — one row per department.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
        <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={620} />
      </div>
    </div>
  );
}
