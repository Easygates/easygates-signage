import type { TemplateProps } from "../parts";
import { clean } from "./discountKit";
import { cleanItems, fitText } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { Barcode, Plate, Stencil, WorkbenchTexture, counterColours, Arrow, INK, PAPER } from "./tradeCounterParts";
import { catCode, shelfGrid, spanWidth } from "./tradeCounterKit";

/**
 * Template "shelf-edge" — up to six white shelf-edge labels on a dark pegboard, the way a
 * trade counter labels its deals: part number, pack size, a huge price and a barcode.
 *
 * FIELDS:
 * - eyebrow      = small mono line above the headline
 * - headline     = the board title, e.g. "PRICES CUT ACROSS THE TRADE COUNTER"
 * - subheadline  = one supporting line under the title
 * - ctaText      = the red plate top-right, e.g. "OFFERS END SUNDAY" (hidden when empty)
 * - items[]      = 1–6 shelf labels; the grid re-flows from one hero label to a 3×2 wall
 *   - items[].name  = product name (up to two lines)
 *   - items[].price = the big price, e.g. "£8.99"
 *   - items[].desc  = the small line under the name, e.g. "Cat No. 3318 · was £12.99"
 *   - items[].tag   = the chip in the label header, e.g. "PACK OF 1000" or "-30%"
 *   - items[].image = optional small product photo; a barcode fills the space without one
 * - accentColor  = the red used for the chips and the label footer
 * - highlightColor = the first label's header colour (safety yellow by default)
 * Not used: imageUrl (each row has its own photo), description, productName, the slide-level prices.
 */
const GRID_W = 1792;
const GAP = 20;

export default function ShelfEdgeTemplate({ scene, d }: TemplateProps) {
  const p = counterColours(scene);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const cta = clean(scene.ctaText);
  const items = cleanItems(scene.items).slice(0, 6);
  const grid = shelfGrid(items.length);

  const head = fitText({ text: headline, boxW: 1220, maxPx: 78, minPx: 46, maxLines: 2, lineHeight: 0.98, ls: -0.03 });
  const subFit = fitText({ text: sub, boxW: 1220, maxPx: 26, minPx: 20, maxLines: 1 });
  const ctaFit = fitText({ text: cta, boxW: 420, maxPx: 24, minPx: 16, maxLines: 2, ls: 0.04 });

  return (
    <div className="absolute inset-0 z-10 select-none">
      <WorkbenchTexture opacity={0.04} />
      <div className="relative flex h-full flex-col" style={{ padding: "110px 64px 64px" }}>
        {/* ── header ── */}
        <div className="flex flex-none items-end justify-between gap-10">
          <div className="min-w-0">
            {eyebrow && (
              <div className="sg-anim sg-fade-down mb-2 flex items-center gap-3" style={d.style(0)}>
                <span style={{ width: 12, height: 24, background: p.accent }} />
                <Stencil color={p.pop} size={18}>{eyebrow}</Stencil>
              </div>
            )}
            {headline && (
              <div
                className="sg-anim sg-fade-up font-black uppercase"
                style={{
                  ...d.style(1),
                  color: "#f8fafc",
                  fontSize: head.px,
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                  overflowWrap: "anywhere",
                }}
              >
                {headline}
              </div>
            )}
            {sub && (
              <p className="sg-anim sg-fade-up" style={{ ...d.style(2), color: "#9aa7b8", fontSize: subFit.px, margin: "10px 0 0", ...clamp(1) }}>
                {sub}
              </p>
            )}
          </div>

          {cta && (
            <div className="sg-anim sg-pop flex-none" style={d.style(3)}>
              <Plate background={p.accent} color={p.accentInk} style={{ fontSize: ctaFit.px, maxWidth: 460, lineHeight: 1.05 }}>
                {cta}
                <Arrow color={p.accentInk} size={22} />
              </Plate>
            </div>
          )}
        </div>

        {/* ── label wall ── */}
        {items.length === 0 ? (
          <div className="mt-8 grid flex-1 place-items-center rounded-2xl" style={{ border: `2px dashed ${p.accent}55`, background: "rgba(255,255,255,0.03)" }}>
            <div className="text-center">
              <Stencil color="#94a3b8" size={20}>SHELF-EDGE LABELS</Stencil>
              <p style={{ color: "#cbd5e1", fontSize: 24, marginTop: 10 }}>Add up to six products in the Rows editor — name, price, pack tag and photo.</p>
            </div>
          </div>
        ) : (
          <div
            className="mt-6 grid min-h-0 flex-1"
            style={{
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gridTemplateRows: `repeat(${grid.rows.length}, minmax(0, 1fr))`,
              gap: GAP,
            }}
          >
            {items.map((it, i) => {
              const span = grid.spans[i] ?? 2;
              const width = spanWidth(span, GRID_W, GAP, 6);
              const nameBox = Math.max(140, width - 32 - (it.image ? 128 : 0));
              const nameFit = fitText({ text: it.name, boxW: nameBox, maxPx: span >= 3 ? 46 : 36, minPx: 22, maxLines: 2, lineHeight: 1.04, ls: -0.02 });
              const priceFit = fitText({ text: it.price || "", boxW: Math.max(160, width * 0.56), maxPx: span >= 3 ? 92 : 72, minPx: 40, maxLines: 1, ls: -0.04 });
              return (
                <A key={i} d={d} i={3 + i} cls="sg-scale-in" className="min-h-0" style={{ gridColumn: `span ${span}`, gridRow: `span 1` }}>
                  <div
                    className="flex h-full flex-col overflow-hidden"
                    style={{ background: PAPER, border: `2px solid ${INK}`, borderRadius: 12, boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}
                  >
                    <div
                      className="flex flex-none items-center justify-between gap-2"
                      style={{ padding: "7px 13px", borderBottom: `2px solid ${INK}`, background: i === 0 ? p.pop : "#e9e3d6", color: INK }}
                    >
                      <Stencil color={i === 0 ? p.popInk : "#4b5563"} size={12.5} style={{ letterSpacing: "0.1em" }}>
                        CAT NO. {catCode(it.name)}
                      </Stencil>
                      {it.tag && (
                        <span
                          style={{
                            background: p.accent,
                            color: p.accentInk,
                            padding: "2px 8px",
                            borderRadius: 3,
                            fontSize: 12.5,
                            fontWeight: 900,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {it.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex min-h-0 flex-1" style={{ padding: "12px 13px 4px", gap: 10 }}>
                      <div className="min-w-0 flex-1">
                        <div style={{ color: INK, fontSize: nameFit.px, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.02em", textTransform: "uppercase", ...clamp(2) }}>
                          {it.name}
                        </div>
                        {it.desc && (
                          <div style={{ color: "#6b7280", fontSize: 13.5, fontWeight: 700, marginTop: 6, lineHeight: 1.25, ...clamp(2) }}>
                            {it.desc}
                          </div>
                        )}
                      </div>

                      {it.image && (
                        <div
                          className="flex-none self-start"
                          style={{ width: 112, height: 106, border: `2px solid ${INK}`, borderRadius: 6, background: "#ffffff", padding: 6 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.image} alt={it.name} className="h-full w-full object-contain" draggable={false} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-none items-end justify-between gap-2" style={{ padding: "0 13px 10px" }}>
                      <div className="flex items-baseline gap-2">
                        <span className="sg-display" style={{ color: p.onPaper, fontSize: priceFit.px, lineHeight: 0.95, letterSpacing: "-0.04em" }}>
                          {it.price || "—"}
                        </span>
                      </div>
                      <Barcode seed={it.name || it.price || String(i)} height={26} unit={2} gap={1.5} bars={22} style={{ width: 78, flex: "none", opacity: 0.7 }} />
                    </div>
                    <div style={{ height: 8, flex: "none", background: p.accent }} />
                  </div>
                </A>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
