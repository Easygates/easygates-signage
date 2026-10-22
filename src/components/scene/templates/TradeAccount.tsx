import type { TemplateProps } from "../parts";
import { clean } from "./discountKit";
import { cleanItems, fitText } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { Arrow, Barcode, HazardTape, INK, PAPER, Plate, Stencil, TickSquare, WorkbenchTexture, counterColours } from "./tradeCounterParts";
import { cardNumber, catCode } from "./tradeCounterKit";

/**
 * Template "trade-account" — a trade-counter sign-up board: an oversized trade card
 * beside the benefits and an apply-now call to action.
 *
 * FIELDS:
 * - eyebrow      = small mono line above the headline
 * - headline     = the offer, e.g. "TRADE PRICES. NO HASSLE."
 * - subheadline  = one supporting line under the headline
 * - description  = the small print under the CTA, e.g. "Credit accounts subject to status"
 * - discountBadge = the stamp across the card, e.g. "NO MINIMUM SPEND"
 * - ctaText      = the red apply plate, e.g. "APPLY AT THE TRADE COUNTER"
 * - items[]      = up to 5 benefits
 *   - items[].name = benefit, e.g. "Trade pricing"
 *   - items[].desc = one line explaining it
 *   - items[].tag  = optional chip, e.g. "VAT-FREE" or "MONTHLY"
 * - accentColor  = the card band and CTA colour
 * - highlightColor = the stamp and tick colour (safety yellow by default)
 * Not used: imageUrl, productName, promoPrice, originalPrice — the account, not a product, is the offer.
 */
export default function TradeAccountTemplate({ scene, d }: TemplateProps) {
  const p = counterColours(scene);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const description = clean(scene.description);
  const stamp = clean(scene.discountBadge);
  const cta = clean(scene.ctaText);
  const benefits = cleanItems(scene.items).slice(0, 5);
  const cardNo = cardNumber(headline || "trade");

  const head = fitText({ text: headline, boxW: 880, maxPx: 82, minPx: 44, maxLines: 2, lineHeight: 0.95, ls: -0.03 });
  const subFit = fitText({ text: sub, boxW: 880, maxPx: 27, minPx: 20, maxLines: 2 });
  const ctaFit = fitText({ text: cta, boxW: 700, maxPx: 26, minPx: 16, maxLines: 1, ls: 0.05 });
  const nameFit = benefits.map((b) => fitText({ text: b.name, boxW: 620, maxPx: 27, minPx: 18, maxLines: 1 }));

  return (
    <div className="absolute inset-0 z-10 select-none">
      <WorkbenchTexture opacity={0.05} />
      <div className="relative flex h-full flex-col" style={{ padding: "110px 64px 64px" }}>
        <HazardTape height={12} color={p.pop} background={INK} stripe={18} style={{ marginBottom: 28, flex: "none" }} />

        <div className="grid min-h-0 flex-1 items-center" style={{ gridTemplateColumns: "minmax(0,0.46fr) minmax(0,0.54fr)", gap: 46 }}>
          {/* ── the trade card ── */}
          <div className="grid min-h-0 place-items-center">
            <A d={d} i={0} cls="sg-scale-in" className="relative" style={{ transform: "rotate(-5deg)" }}>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: p.deep, borderRadius: 18, transform: "translate(16px, 18px)" }}
              />
              <div
                className="relative overflow-hidden"
                style={{ width: 660, background: PAPER, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: "0 26px 60px rgba(0,0,0,0.45)" }}
              >
                <div className="flex items-center justify-between" style={{ background: p.accent, color: p.accentInk, padding: "16px 22px" }}>
                  <span className="font-black uppercase" style={{ fontSize: 32, letterSpacing: "0.1em" }}>Trade account</span>
                  <span style={{ width: 46, height: 34, background: p.pop, borderRadius: 5, border: `2px solid ${INK}` }} />
                </div>

                <div style={{ height: 10, background: `repeating-linear-gradient(90deg, ${INK} 0 26px, ${p.pop} 26px 52px)` }} />

                <div style={{ padding: "22px 24px 18px" }}>
                  <Stencil color="#6b7280" size={13}>CARD NO.</Stencil>
                  <div className="flex items-end justify-between gap-3">
                    <span style={{ color: INK, fontSize: 40, fontWeight: 900, letterSpacing: "0.12em", lineHeight: 1 }}>{cardNo}</span>
                    <Stencil color="#6b7280" size={13}>MEMBER</Stencil>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <Stencil color="#6b7280" size={12}>VAT-FREE TRADE PRICES</Stencil>
                      <div style={{ color: INK, fontSize: 19, fontWeight: 800, marginTop: 4 }}>RAPIDFIX TRADE COUNTER</div>
                    </div>
                    <div style={{ color: INK, fontFamily: "ui-monospace, monospace", fontSize: 13, letterSpacing: "0.08em", textAlign: "right" }}>
                      CAT {catCode("trade-account")}
                      <br />
                      VALID ALL BRANCHES
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <Barcode seed={cardNo} height={46} unit={3} gap={2} bars={44} style={{ opacity: 0.85 }} />
                    <span style={{ color: "#94a3b8", fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.1em" }}>UK · TRADE</span>
                  </div>
                </div>

                <HazardTape height={10} color={p.pop} background={INK} stripe={14} />

                {stamp && (
                  <div className="absolute" style={{ right: -14, top: 74, transform: "rotate(-9deg)" }}>
                    <span
                      className="inline-block font-black uppercase"
                      style={{ background: p.pop, color: p.popInk, border: `3px solid ${INK}`, padding: "7px 14px", fontSize: 21, letterSpacing: "0.03em", boxShadow: "0 5px 0 rgba(0,0,0,0.3)" }}
                    >
                      {stamp}
                    </span>
                  </div>
                )}
              </div>
            </A>
          </div>

          {/* ── benefits + CTA ── */}
          <div className="flex min-h-0 flex-col justify-center gap-3">
            {eyebrow && (
              <div className="sg-anim sg-fade-down flex items-center gap-3" style={d.style(0)}>
                <span style={{ width: 12, height: 24, background: p.pop }} />
                <Stencil color={p.pop} size={18}>{eyebrow}</Stencil>
              </div>
            )}

            {headline && (
              <div
                className="sg-anim sg-fade-up font-black uppercase"
                style={{ ...d.style(1), color: "#ffffff", fontSize: head.px, lineHeight: 0.95, letterSpacing: "-0.03em", textWrap: "balance", overflowWrap: "anywhere" }}
              >
                {headline}
              </div>
            )}

            {sub && (
              <p className="sg-anim sg-fade-up" style={{ ...d.style(2), color: "#a9b5c4", fontSize: subFit.px, lineHeight: 1.3, margin: "2px 0 4px", ...clamp(2) }}>
                {sub}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              {benefits.map((benefit, i) => (
                <A key={i} d={d} i={4 + i} cls="sg-slide-r" className="min-w-0">
                  <div className="flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                    <TickSquare size={30} background={p.pop} color={p.popInk} />
                    <div className="min-w-0 flex-1">
                      <div style={{ color: "#f8fafc", fontSize: nameFit[i]?.px ?? 26, fontWeight: 900, lineHeight: 1.1, ...clamp(1) }}>{benefit.name}</div>
                      {benefit.desc && <div style={{ color: "#93a1b2", fontSize: 17, marginTop: 2, ...clamp(1) }}>{benefit.desc}</div>}
                    </div>
                    {benefit.tag && (
                      <span
                        className="flex-none font-black uppercase"
                        style={{ background: "rgba(255,255,255,0.1)", color: p.pop, padding: "4px 9px", borderRadius: 4, fontSize: 12.5, letterSpacing: "0.06em", whiteSpace: "nowrap" }}
                      >
                        {benefit.tag}
                      </span>
                    )}
                  </div>
                </A>
              ))}
              {benefits.length === 0 && (
                <div className="rounded-xl p-4" style={{ border: `2px dashed ${p.accent}66`, color: "#9aa7b8", fontSize: 18 }}>
                  List the account benefits in the Rows editor.
                </div>
              )}
            </div>

            {cta && (
              <div className="sg-anim sg-pop mt-2" style={d.style(10)}>
                <Plate background={p.accent} color={p.accentInk} style={{ fontSize: ctaFit.px }}>
                  {cta}
                  <Arrow color={p.accentInk} size={22} />
                </Plate>
              </div>
            )}

            {description && (
              <p className="sg-anim sg-fade" style={{ ...d.style(11), color: "#7c8798", fontSize: 15, lineHeight: 1.35, margin: 0, ...clamp(2) }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
