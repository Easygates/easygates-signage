import type { TemplateProps } from "../parts";
import { kbClass } from "../parts";
import { clean } from "./discountKit";
import { cleanItems, fitText } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { Arrow, Barcode, CatPlate, HazardTape, INK, PAPER, Plate, Stencil, WorkbenchTexture, counterColours } from "./tradeCounterParts";
import { catCode, savingLabel } from "./tradeCounterKit";

const STEEL_BAR = "#2b3947";

/**
 * Template "bulk-buy" — the trade counter's quantity-break board: a product shot on a
 * catalogue card beside a "buy more, pay less" price ladder.
 *
 * FIELDS:
 * - eyebrow      = small mono line above the headline, e.g. "RAPIDFIX · TRADE COUNTER"
 * - headline     = the campaign line, e.g. "BUY MORE. PAY LESS."
 * - subheadline  = one supporting line under the headline
 * - productName  = the product name on the photo card (also seeds the catalogue number)
 * - description  = a short sentence under the price ladder
 * - originalPrice = the single-unit "was" price, struck through beside the from-price
 * - promoPrice   = the headline "from" price (the best tier), shown big at the bottom
 * - discountBadge = sticker on the photo card; when empty a saving is calculated from the prices
 * - ctaText      = the plate along the bottom, e.g. "TRADE PRICES · IN STORE NOW"
 * - imageUrl     = the product photo, shown whole on a white card
 * - items[]      = up to 4 quantity breaks
 *   - items[].name  = the quantity band, e.g. "1–4" or "10+"
 *   - items[].price = the price each at that band, e.g. "£119.99"
 *   - items[].desc  = what the price is for, e.g. "each"
 *   - items[].tag   = the saving chip, e.g. "SAVE £30" (the last row is highlighted automatically)
 * - accentColor  = the counter red; safe text colours are derived
 * - highlightColor = the second colour (safety yellow by default)
 * - kenBurns     = slow zoom on the product photo
 * Not used: layoutVariant, theme decorations have no effect on the card layout.
 */
export default function BulkBuyTemplate({ scene, d }: TemplateProps) {
  const p = counterColours(scene);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const name = clean(scene.productName);
  const desc = clean(scene.description);
  const orig = clean(scene.originalPrice);
  const promo = clean(scene.promoPrice);
  const badge = clean(scene.discountBadge) || savingLabel(orig, promo);
  const cta = clean(scene.ctaText);
  const image = clean(scene.imageUrl);
  const tiers = cleanItems(scene.items).slice(0, 4);
  const code = catCode(name || headline || "trade");

  const head = fitText({ text: headline, boxW: 960, maxPx: 92, minPx: 54, maxLines: 2, lineHeight: 0.95, ls: -0.03 });
  const subFit = fitText({ text: sub, boxW: 960, maxPx: 30, minPx: 22, maxLines: 2 });
  const nameFit = fitText({ text: name, boxW: 660, maxPx: 46, minPx: 28, maxLines: 2, ls: -0.02 });
  const from = promo || orig;
  const fromFit = fitText({ text: from, boxW: 460, maxPx: 88, minPx: 46, maxLines: 1, ls: -0.04 });
  const ctaFit = fitText({ text: cta, boxW: 520, maxPx: 24, minPx: 16, maxLines: 1, ls: 0.04 });

  return (
    <div className="absolute inset-0 z-10 select-none">
      <WorkbenchTexture />
      <div className="relative flex h-full flex-col" style={{ padding: "110px 64px 64px" }}>
        <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: "760px minmax(0,1fr)", gap: 56 }}>
          {/* ── catalogue photo card ── */}
          <A d={d} i={0} cls="sg-scale-in" className="relative min-h-0">
            <div
              className="flex h-full flex-col overflow-hidden"
              style={{
                background: PAPER,
                border: `3px solid ${INK}`,
                borderRadius: 20,
                boxShadow: "0 34px 70px rgba(0,0,0,0.45)",
              }}
            >
              <div className="flex flex-none items-center justify-between gap-3" style={{ background: p.accent, color: p.accentInk, padding: "12px 18px" }}>
                <span className="font-black uppercase" style={{ fontSize: 20, letterSpacing: "0.1em" }}>
                  ● In stock
                </span>
                <CatPlate code={code} color="#ffffff" />
              </div>

              <div className="relative min-h-0 flex-1" style={{ background: "#ffffff" }}>
                {image ? (
                  <div className={`absolute inset-0 ${kbClass(scene.kenBurns)}`}>
                    <div className="absolute" style={{ inset: "6%" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={name || headline || "product"}
                        className="h-full w-full object-contain"
                        style={{ objectPosition: scene.imagePosition || "center", filter: "contrast(1.04)" }}
                        draggable={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 grid place-items-center" style={{ background: "#ffffff" }}>
                    <div className="text-center">
                      <Stencil color="#94a3b8" size={20}>PRODUCT PHOTO</Stencil>
                      <div className="mt-3" style={{ color: "#cbd5e1", fontSize: 120, fontWeight: 900, lineHeight: 1 }}>⌗</div>
                    </div>
                  </div>
                )}

                {badge && (
                  <div className="absolute" style={{ left: 20, top: 20, transform: "rotate(-5deg)" }}>
                    <span
                      className="inline-block font-black uppercase"
                      style={{
                        background: p.pop,
                        color: p.popInk,
                        border: `3px solid ${INK}`,
                        padding: "8px 16px",
                        fontSize: 24,
                        letterSpacing: "0.02em",
                        boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
                      }}
                    >
                      {badge}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-none items-end justify-between gap-4" style={{ padding: "16px 20px 14px", borderTop: `3px solid ${INK}`, background: PAPER }}>
                <div className="min-w-0">
                  <div style={{ color: INK, fontSize: nameFit.px, fontWeight: 900, lineHeight: 1.03, letterSpacing: "-0.02em", ...clamp(2) }}>
                    {name || "Product name"}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Stencil color={p.onPaper} size={14}>TRADE COUNTER</Stencil>
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>·</span>
                    <Stencil color="#7c8798" size={14}>SAME-DAY COLLECTION</Stencil>
                  </div>
                </div>
                <Barcode seed={name || code} height={34} unit={2} gap={1.5} bars={26} style={{ opacity: 0.65, width: 92, flex: "none" }} />
              </div>
              <HazardTape height={12} color={p.pop} background={INK} stripe={16} />
            </div>
          </A>

          {/* ── words + price ladder ── */}
          <div className="flex min-h-0 flex-col justify-center" style={{ gap: 16 }}>
            {eyebrow && (
              <div className="sg-anim sg-fade-down flex items-center gap-3" style={d.style(0)}>
                <span style={{ width: 12, height: 26, background: p.accent }} />
                <Stencil color={p.pop} size={19}>{eyebrow}</Stencil>
              </div>
            )}

            {headline && (
              <div
                className="sg-anim sg-fade-up font-black uppercase"
                style={{
                  ...d.style(1),
                  color: "#f8fafc",
                  fontSize: head.px,
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                  overflowWrap: "anywhere",
                }}
              >
                {headline}
              </div>
            )}

            {sub && (
              <p className="sg-anim sg-fade-up" style={{ ...d.style(2), color: "#a9b5c4", fontSize: subFit.px, lineHeight: 1.25, margin: 0, ...clamp(2) }}>
                {sub}
              </p>
            )}

            <div
              className="sg-anim sg-fade-up overflow-hidden"
              style={{ ...d.style(3), border: `2px solid ${p.accent}`, borderRadius: 12, marginTop: 2 }}
            >
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,0.9fr)",
                  gap: 12,
                  padding: "9px 18px",
                  background: STEEL_BAR,
                }}
              >
                <Stencil size={14} color="#9fb0c2">BUY</Stencil>
                <Stencil size={14} color="#9fb0c2">PRICE EACH</Stencil>
                <Stencil size={14} color="#9fb0c2" style={{ textAlign: "right" }}>SAVING</Stencil>
              </div>

              {tiers.length === 0 && (
                <div style={{ padding: "18px 18px", background: "#16202b", color: "#94a3b8", fontSize: 18 }}>
                  Add quantity breaks in the Rows editor — 1–4 / 5–9 / 10+ works well.
                </div>
              )}

              {tiers.map((tier, i) => {
                const best = i === tiers.length - 1;
                return (
                  <div
                    key={i}
                    className="sg-anim sg-slide-r grid items-center"
                    style={{
                      ...d.style(4 + i),
                      gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,0.9fr)",
                      gap: 12,
                      padding: "11px 18px",
                      background: best ? p.accent : i % 2 ? "#16202b" : "#1b2733",
                      color: best ? p.accentInk : "#e2e8f0",
                      borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ fontSize: 31, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{tier.name || `${i + 1}+`}</span>
                    <span className="flex min-w-0 items-baseline gap-2.5">
                      <span className="sg-display" style={{ fontSize: 40, lineHeight: 1, color: best ? p.accentInk : "#ffffff" }}>{tier.price || "—"}</span>
                      {tier.desc && <span style={{ fontSize: 17, opacity: 0.75, whiteSpace: "nowrap" }}>{tier.desc}</span>}
                    </span>
                    <span className="flex justify-end">
                      <span
                        style={{
                          background: best ? p.pop : "rgba(255,255,255,0.12)",
                          color: best ? p.popInk : "#e2e8f0",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 15,
                          fontWeight: 900,
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tier.tag || (best ? "BEST PRICE" : "")}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5" style={{ marginTop: 2 }}>
              <div>
                <Stencil size={15} color="#94a3b8">FROM</Stencil>
                <div className="flex items-baseline gap-4">
                  <span className="sg-anim sg-price sg-display" style={{ ...d.style(8), color: p.pop, fontSize: fromFit.px, lineHeight: 1, textShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                    {from || "—"}
                  </span>
                  {orig && promo && (
                    <span style={{ color: "#94a3b8", fontSize: 27, fontWeight: 700, textDecoration: "line-through" }}>{orig}</span>
                  )}
                </div>
              </div>

              {cta && (
                <div className="sg-anim sg-pop" style={d.style(9)}>
                  <Plate background="#ffffff" color={INK} style={{ fontSize: ctaFit.px, borderRadius: 8, padding: "12px 20px" }}>
                    {cta}
                    <Arrow color={p.accent} size={22} />
                  </Plate>
                </div>
              )}
            </div>

            {desc && (
              <p className="sg-anim sg-fade" style={{ ...d.style(10), color: "#8b98a8", fontSize: 19, lineHeight: 1.35, margin: 0, ...clamp(2) }}>
                {desc}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
