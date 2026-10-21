import type { TemplateProps } from "../parts";
import { A, BigArrow, CtaPill, INK, Icon, SLATE, clamp, palette } from "./storeBoardParts";
import { aisleLabelLayout, aisleText, arrowDirection, countLines, fitText } from "./storeBoardKit";

/**
 * Template "aisle-guide" — store wayfinding: a giant aisle circle and arrow on the left,
 * department name and sub-category list on the right. Built to be read from across the shop.
 *
 * FIELDS:
 * - productName   = the aisle number or label shown in the giant circle: keep it short, e.g. "7" or "12A"
 *                   (up to 6 characters; the type shrinks to fit). A number gets the word "AISLE" above it.
 * - headline      = the department name in big letters, e.g. "TINNED GOODS"
 * - subheadline   = helper line under the department name, e.g. "Soups, beans and vegetables"
 * - layoutVariant = arrow direction: "left", "right" or "ahead" (any capitals; anything else, including the old "A"/"B", means ahead)
 * - eyebrow       = small pill above the department name, e.g. "VALUE STORE · FIND YOUR WAY"
 * - items[]       = the sub-categories listed on the right, up to 6
 *   - items[].name = sub-category, e.g. "Tinned soups"
 *   - items[].desc = optional small line under it, e.g. "Chicken, tomato, vegetable"
 * - ctaText       = optional button at the bottom, e.g. "FOLLOW THE SIGNS" (hidden when empty)
 * - accentColor   = colour of the aisle circle and list icons (text on it turns dark or white automatically)
 * Older slides that put "AISLE 7" in the headline and the department in productName are swapped automatically.
 * Not used: description, items[].price/tag/image, the slide-level prices, imageUrl.
 */

const PANEL_W = 800;
const CIRCLE = 600;
const CARD_X = 840;
const CARD_W = 1032; // 840 + 1032 = 1872
const CARD_PAD_X = 52;
const CARD_PAD_Y = 40;
const BORDER = 4;

const DIR_LABEL = { left: "TURN LEFT", right: "TURN RIGHT", ahead: "STRAIGHT AHEAD" } as const;

export default function AisleGuideTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const dir = arrowDirection(scene.layoutVariant);
  const { label, caption, department } = aisleText(scene.productName, scene.headline);
  const eyebrow = (scene.eyebrow || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const items = (scene.items || []).filter((it) => it && (it.name || "").trim()).slice(0, 6);
  const n = items.length;

  // circle label
  const lab = aisleLabelLayout(label, 410, 320);

  // arrow bar label
  const barLabel = fitText({ text: DIR_LABEL[dir], boxW: CIRCLE - 2 * 34 - 150 - 28, maxPx: 54, minPx: 36, maxLines: 2, upper: true, lineHeight: 0.98 });

  // right card: work out the heights so the list gets the room it needs
  const innerW = CARD_W - 2 * CARD_PAD_X - 2 * BORDER;
  const innerH = 906 - 2 * CARD_PAD_Y - 2 * BORDER;
  const gap = 18;
  const eyebrowH = eyebrow ? countLines(eyebrow, 22, innerW - 32, { upper: true, ls: 0.14 }) * 25 + 10 : 0;
  const subFit = fitText({ text: sub, boxW: innerW, maxPx: n <= 3 ? 40 : 36, minPx: 28, maxLines: 3, lineHeight: 1.2 });
  const subH = sub ? Math.round(subFit.lines * subFit.px * 1.2) : 0;
  const ctaH = cta ? 74 : 0;

  const cols = n >= 4 ? 2 : 1;
  const listRows = Math.ceil(n / cols);
  const listGap = 14;
  const minRow = cols === 1 ? 96 : 112;
  const needList = n ? listRows * minRow + listGap * (listRows - 1) : 0;

  // the department name is as big as it can be while still leaving the list its room
  let head = fitText({ text: department, boxW: innerW, maxPx: 64, minPx: 64, maxLines: 3, upper: true, lineHeight: 0.95, ls: -0.03 });
  let listH = 0;
  for (let px = 150; px >= 64; px -= 4) {
    const f = fitText({ text: department, boxW: innerW, maxPx: px, minPx: px, maxLines: 3, upper: true, lineHeight: 0.95, ls: -0.03 });
    if (!f.fits && px > 64) continue;
    const hh = department ? Math.round(f.lines * f.px * 0.95) + 14 : 0;
    const blocks = [eyebrowH, hh, subH, ctaH].filter((h) => h > 0);
    const used = blocks.reduce((acc, h) => acc + h, 0) + gap * blocks.length; // one gap after each block, one before the list
    head = f;
    listH = Math.max(0, innerH - used);
    if (listH >= needList || px === 64) break;
  }

  const maxRow = cols === 2 ? 132 : n === 1 ? 176 : n === 2 ? 150 : 130;
  const rowH = n ? Math.max(76, Math.min(maxRow, Math.floor((listH - listGap * (listRows - 1)) / listRows))) : 0;
  const colW = (innerW - (cols - 1) * 20) / cols;
  const nameMax = cols === 2 ? 40 : n <= 2 ? 60 : 52;
  const descPx = cols === 2 ? 26 : n <= 2 ? 34 : 30;
  const iconBox = cols === 2 ? 54 : 64;
  const textW = colW - iconBox - 3 * 18 - 8;

  return (
    <div className="absolute inset-0 z-10">
      {/* left: navy sign panel with the circle and the arrow */}
      <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: PANEL_W, background: pal.navy }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg, rgba(255,255,255,0.045) 0 30px, transparent 30px 60px)" }}
        />
        <svg aria-hidden="true" width={PANEL_W} height={1080} viewBox={`0 0 ${PANEL_W} 1080`} style={{ position: "absolute", inset: 0 }}>
          <circle cx={PANEL_W / 2} cy={138 + CIRCLE / 2} r={CIRCLE / 2 + 56} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
          <circle cx={PANEL_W / 2} cy={138 + CIRCLE / 2} r={CIRCLE / 2 + 108} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        </svg>

        <A d={d} i={1} cls="sg-pop" slow style={{ position: "absolute", left: (PANEL_W - CIRCLE) / 2, top: 138, width: CIRCLE, height: CIRCLE }}>
          <div style={{ width: CIRCLE, height: CIRCLE, borderRadius: 999, background: "#ffffff", display: "grid", placeItems: "center", boxShadow: "0 14px 0 rgba(0,0,0,0.35)" }}>
            <div
              style={{
                width: CIRCLE - 56,
                height: CIRCLE - 56,
                borderRadius: 999,
                background: pal.solid,
                color: pal.solidInk,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                textAlign: "center",
              }}
            >
              {lab.lines.length === 0 ? (
                <Icon id="pin" size={300} color={pal.solidInk} stroke={1.6} />
              ) : (
                <>
                  {caption && <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "0.3em", textIndent: "0.3em", textTransform: "uppercase", lineHeight: 1 }}>{caption}</div>}
                  <div style={{ fontSize: lab.px, fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.03em", textTransform: "uppercase", overflowWrap: "anywhere" }}>
                    {lab.lines.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </A>

        <A
          d={d}
          i={3}
          cls="sg-fade-up"
          style={{
            position: "absolute",
            left: (PANEL_W - CIRCLE) / 2,
            top: 790,
            width: CIRCLE,
            height: 196,
            borderRadius: 32,
            background: pal.pop,
            color: pal.popInk,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            boxShadow: "0 9px 0 rgba(0,0,0,0.35)",
          }}
        >
          {dir === "right" ? (
            <>
              <div style={{ fontSize: barLabel.px, fontWeight: 900, lineHeight: 0.98, textTransform: "uppercase", maxWidth: 358 }}>{DIR_LABEL[dir]}</div>
              <BigArrow dir={dir} size={150} color={pal.popInk} />
            </>
          ) : (
            <>
              <BigArrow dir={dir} size={150} color={pal.popInk} />
              <div style={{ fontSize: barLabel.px, fontWeight: 900, lineHeight: 0.98, textTransform: "uppercase", maxWidth: 358 }}>{DIR_LABEL[dir]}</div>
            </>
          )}
        </A>
      </div>

      {/* right: department card */}
      <A
        d={d}
        i={2}
        cls="sg-fade-up"
        style={{
          position: "absolute",
          left: CARD_X,
          top: 110,
          width: CARD_W,
          height: 906,
          background: "#ffffff",
          color: INK,
          borderRadius: 34,
          border: `${BORDER}px solid ${pal.navy}`,
          boxShadow: "0 9px 0 rgba(15,23,42,0.30)",
          padding: `${CARD_PAD_Y}px ${CARD_PAD_X}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: n === 0 ? "center" : "flex-start",
          gap,
          overflow: "hidden",
        }}
      >
        {eyebrow && (
          <div
            style={{
              alignSelf: "flex-start",
              background: pal.navy,
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              lineHeight: 1.15,
              padding: "5px 16px",
              borderRadius: 8,
              overflowWrap: "anywhere",
            }}
          >
            {eyebrow}
          </div>
        )}

        {department && (
          <div style={{ flex: "none" }}>
            <h1
              className="sg-display"
              style={{ margin: 0, fontSize: head.px, lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase", overflowWrap: "anywhere", color: INK, ...(head.fits ? {} : clamp(3)) }}
            >
              {department}
            </h1>
            <div style={{ marginTop: 14, height: 14, width: 150, borderRadius: 999, background: pal.solid, boxShadow: `0 0 0 3px ${pal.navy}` }} />
          </div>
        )}

        {sub && <div style={{ flex: "none", fontSize: subFit.px, lineHeight: 1.2, fontWeight: 700, color: SLATE, overflowWrap: "anywhere" }}>{sub}</div>}

        {n > 0 && (
          <div
            style={{
              flex: "1 1 0",
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: rowH,
              columnGap: 20,
              rowGap: listGap,
              alignContent: "center",
            }}
          >
            {items.map((it, i) => {
              const name = (it.name || "").trim();
              const desc = (it.desc || "").trim();
              const descLineH = Math.round(descPx * 1.15);
              const nf = fitText({ text: name, boxW: textW, boxH: rowH - 22 - (desc ? descLineH : 0), maxPx: nameMax, minPx: 28, maxLines: 2, lineHeight: 1.05 });
              // the small line only shows when it really fits under the name
              const descLines = desc ? Math.min(2, Math.floor((rowH - 22 - Math.round(nf.lines * nf.px * 1.05)) / descLineH)) : 0;
              const df = fitText({ text: desc, boxW: textW, maxPx: descPx, minPx: 22, maxLines: Math.max(1, descLines), lineHeight: 1.15 });
              return (
                <A
                  key={i}
                  d={d}
                  i={4 + i}
                  cls="sg-slide-l"
                  style={{ display: "flex", alignItems: "center", gap: 18, background: "#f1f5f9", borderRadius: 20, padding: "0 18px", minWidth: 0, overflow: "hidden" }}
                >
                  <span style={{ flex: "none", display: "grid", placeItems: "center", width: iconBox, height: iconBox, borderRadius: 999, background: pal.solid }}>
                    <Icon id="chevron" size={Math.round(iconBox * 0.58)} color={pal.solidInk} stroke={3.2} />
                  </span>
                  <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: nf.px, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.01em", overflowWrap: "anywhere", ...(nf.fits ? {} : clamp(2)) }}>{name}</span>
                    {descLines > 0 && <span style={{ fontSize: df.px, lineHeight: 1.15, fontWeight: 600, color: SLATE, overflowWrap: "anywhere", ...(df.fits ? {} : clamp(descLines)) }}>{desc}</span>}
                  </span>
                </A>
              );
            })}
          </div>
        )}

        {cta && (
          <A d={d} i={5 + n} cls="sg-pop" style={{ flex: "none", alignSelf: "flex-start", marginTop: n > 0 ? 0 : "auto", maxWidth: "100%" }}>
            <CtaPill text={cta} bg={pal.navy} fg="#ffffff" />
          </A>
        )}
      </A>
    </div>
  );
}
