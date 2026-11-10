import type { CSSProperties } from "react";
import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, Chip, CtaBar, Frame, Head, MARGIN, TOP, fitPx, rowIcon } from "./brandParts";
import { alpha, kit, rows, wallColumns, type Kit } from "./brandKit";

/**
 * Template "eg-category-wall" — EasyGates Direct · Shop by Category.
 *
 * The department wall of the trade counter: a grid of category tiles, each with
 * an icon picked from the category name (gate → gate, access control → key,
 * safety edges → shield) plus the line count and a couple of example products.
 * Four across on one row, five or six as a roomier 3×2 grid (the icon sits beside
 * the words, the type is bigger), or seven or eight as a 4×2 wall.
 *
 * It also serves as an "at a glance" board for an event or a list of benefits:
 * the icon follows words in the title or chip (food, drink, giveaway, raffle,
 * offer, supplier, £ …), so "Free food & drink" gets a cup and "Charity raffle" a trophy.
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
 *   - image = optional category photo
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

type Mode = "row" | "grid" | "wall";

function Tile({ k, i, cols, mode, name, desc, tag, image, w, h }: { k: Kit; i: number; cols: number; mode: Mode; name: string; desc?: string; tag?: string; image?: string; w: number; h: number | string }) {
  const icon = rowIcon({ name, desc, tag }, i);
  const alt = i % cols === 1; // the middle column takes the second accent
  const fill = alt ? k.solid2 : k.solid;
  const ink = alt ? k.solid2Ink : k.solidInk;
  const compact = mode === "wall";
  const side = mode === "grid";
  const frame: CSSProperties = {
    width: w,
    height: h,
    boxSizing: "border-box",
    borderRadius: 20,
    background: alpha(k.text, k.dark ? 0.05 : 0.03),
    border: `1px solid ${k.line}`,
    borderTop: `6px solid ${fill}`,
    overflow: "hidden",
  };

  if (side) {
    // 3×2 grid: the icon (or photo) beside the words, so the type can be big
    const badge = 76;
    const textW = w - 48 - badge - 22;
    const namePx = fitPx(name, textW, 40, 24, 2);
    return (
      <div className="sg-anim sg-fade-up" style={{ ...frame, display: "flex", alignItems: "flex-start", gap: 22, padding: "22px 24px", animationDelay: `${150 + i * 70}ms` }}>
        {image ? (
          <Frame src={image} alt={name} w={150} h={150} k={k} radius={12} fit="cover" />
        ) : (
          <span style={{ flex: "none", display: "grid", placeItems: "center", width: badge, height: badge, borderRadius: 20, background: fill }}>
            <BrandIcon id={icon} size={44} color={ink} stroke={2.4} />
          </span>
        )}
        <span style={{ flex: "1 1 auto", minWidth: 0, height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ display: "block", fontSize: namePx, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.01em", color: k.text, overflowWrap: "anywhere" }}>{name}</span>
          {desc ? <span style={{ display: "block", fontSize: 24, fontWeight: 600, lineHeight: 1.24, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
          {tag ? (
            <span style={{ marginTop: "auto", alignSelf: "flex-start", flex: "none" }}>
              <Chip k={k} text={tag} fill={alpha(k.accent, 0.16)} ink={k.accent} px={17} />
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  const namePx = fitPx(name, w - 40, compact ? 30 : 40, 18, 2);
  const descPx = compact ? 19 : 23;
  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        ...frame,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: compact ? "18px" : "24px 22px",
        animationDelay: `${150 + i * 70}ms`,
      }}
    >
      {image ? <Frame src={image} alt={name} w="100%" h={compact ? 105 : 240} k={k} radius={12} fit="cover" /> : <span style={{ flex: "none", display: "grid", placeItems: "center", width: compact ? 52 : 62, height: compact ? 52 : 62, borderRadius: 18, background: fill }}>
        <BrandIcon id={icon} size={compact ? 30 : 36} color={ink} stroke={2.4} />
      </span>}
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
  const cols = wallColumns(items.length);
  const mode: Mode = items.length <= 4 ? "row" : cols === 3 ? "grid" : "wall";
  const totalW = 1920 - MARGIN * 2;
  const gap = 20;
  const w = Math.floor((totalW - gap * (cols - 1)) / cols);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 20 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      {/* a short last row (five tiles in a 3×2 grid) is centred rather than left with a hole beside it */}
      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexWrap: "wrap", gap, alignContent: "stretch", justifyContent: mode === "grid" ? "center" : "flex-start" }}>
        {items.length ? (
          items.map((it, i) => (
            <Tile key={i} k={k} i={i} cols={cols} mode={mode} name={it.name} desc={it.desc} tag={it.tag} image={it.image} w={w} h={mode === "row" ? "100%" : "calc(50% - 10px)"} />
          ))
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
