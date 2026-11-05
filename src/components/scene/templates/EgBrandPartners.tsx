import type { TemplateProps } from "../parts";
import { BOTTOM, CtaBar, Frame, Head, MARGIN, TOP, fitPx, longestWord } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-brand-partners" — EasyGates Direct · Brands We Stock.
 *
 * A manufacturer wall: the brands held on the shelf, each on a white logo plate. Add the
 * manufacturer's logo as the row's image and it fills the plate; without one the brand
 * name is set in the plate instead. The category sits underneath. Ten across two rows,
 * or five in one.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "EASYGATES DIRECT · BRANDS"
 * - headline    = the wall title, e.g. "THE MAKES WE HOLD"
 * - subheadline = one line under the headline
 * - ctaText     = button bottom-right, e.g. "ASK FOR A TRADE PRICE"
 * - items[]     = the manufacturers, up to ten:
 *   - name = the brand, e.g. "CAME"
 *   - desc = what we stock of theirs, e.g. "Gate operators & control panels"
 *   - image = the manufacturer's logo (a transparent PNG or SVG on white works best)
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

const COLS = 5;

function BrandTile({ k, i, name, desc, image, w, h }: { k: Kit; i: number; name: string; desc?: string; image?: string; w: number; h: number | string }) {
  // three-in-a-row rhythm for the accent bar and the name when it has to stand in for a logo
  const tone = i % 3 === 0 ? k.text : i % 3 === 1 ? k.accent : k.accent2;
  // every tile reserves a white logo plate (manufacturer logos are drawn for white). With no logo
  // uploaded the brand name is set in the plate instead, so the wall looks finished either way.
  // Names are drawn in capitals, so they are measured in capitals, and sized for the longest word so
  // no brand ever breaks in the middle ("HÖRMAN / N").
  const plateInner = w - 46 - 28;
  const plateNamePx = Math.min(fitPx(name, plateInner, 52, 20, 2, 0.02, true), fitPx(longestWord(name), plateInner, 52, 20, 1, 0.02, true));
  const captionPx = fitPx(name, w - 46, 28, 18, 1, 0.04, true);
  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "20px 20px 18px",
        borderRadius: 16,
        background: alpha(k.text, k.dark ? 0.04 : 0.03),
        border: `1px solid ${k.line}`,
        overflow: "hidden",
        animationDelay: `${150 + i * 60}ms`,
      }}
    >
      <span style={{ display: "block", width: 44, height: 6, borderRadius: 99, background: tone, flex: "none" }} />
      <span
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          padding: 10,
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: k.dark ? "inset 0 0 0 1px rgba(15,23,42,0.08)" : `inset 0 0 0 1px ${k.line}`,
          overflow: "hidden",
        }}
      >
        {image ? <Frame src={image} alt={name} w="100%" h="100%" k={k} radius={8} fit="contain" /> : (
          <span style={{ display: "block", fontSize: plateNamePx, fontWeight: 900, lineHeight: 1.02, letterSpacing: "0.02em", textAlign: "center", textTransform: "uppercase", color: "#0b1620" }}>{name}</span>
        )}
      </span>
      {image ? (
        <span style={{ display: "block", flex: "none", fontSize: captionPx, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: tone, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      ) : null}
      {desc ? <span style={{ display: "block", flex: "none", fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
    </div>
  );
}

export default function EgBrandPartnersTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 10);
  const totalW = 1920 - MARGIN * 2;
  const gap = 16;
  const w = Math.floor((totalW - gap * (COLS - 1)) / COLS);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 20 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexWrap: "wrap", gap, alignContent: "stretch" }}>
        {items.length ? (
          items.map((it, i) => (
            <BrandTile key={i} k={k} i={i} name={it.name} desc={it.desc} image={it.image} w={w} h={items.length > COLS ? "calc(50% - 8px)" : "100%"} />
          ))
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add the manufacturers in the editor — one row per brand.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
        <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={620} />
      </div>
    </div>
  );
}
