import type { TemplateProps } from "../parts";
import { clean } from "./discountKit";
import { cleanItems, fitText } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { INK, MUTED, Stencil, Stopwatch, WorkbenchTexture, counterColours } from "./tradeCounterParts";
import { stepLabel } from "./tradeCounterKit";

/**
 * Template "click-collect" — the trade counter's collection promise: a big stopwatch
 * beside the three steps from order to counter.
 *
 * FIELDS:
 * - eyebrow      = small mono line above the headline
 * - headline     = the promise, e.g. "CLICK & COLLECT IN 1 MINUTE"
 * - subheadline  = one supporting line under the headline
 * - productName  = the label inside the stopwatch dial, e.g. "1 MINUTE"
 * - description  = the small print under the dial
 * - ctaText      = the yellow strip along the bottom, e.g. "ORDER ONLINE · COLLECT IN STORE"
 * - imageUrl     = optional photo card under the steps (counter, parcels, product)
 * - items[]      = up to 4 steps
 *   - items[].name = step title, e.g. "Order online"
 *   - items[].desc = what happens, e.g. "Browse 20,000+ lines and pay as normal"
 *   - items[].tag  = the timing chip, e.g. "6PM CUT-OFF"
 * - accentColor  = the dial panel and step numbers
 * - highlightColor = the bottom strip (safety yellow by default)
 * - kenBurns     = slow zoom on the optional photo
 * Not used: originalPrice, promoPrice, discountBadge — this template sells convenience, not a price.
 */
export default function ClickCollectTemplate({ scene, d }: TemplateProps) {
  const p = counterColours(scene);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const dial = clean(scene.productName) || "1 MINUTE";
  const description = clean(scene.description);
  const cta = clean(scene.ctaText);
  const image = clean(scene.imageUrl);
  const steps = cleanItems(scene.items).slice(0, 4);

  const head = fitText({ text: headline, boxW: 1180, maxPx: 92, minPx: 50, maxLines: 2, lineHeight: 0.96, ls: -0.03 });
  const subFit = fitText({ text: sub, boxW: 1180, maxPx: 28, minPx: 21, maxLines: 1 });
  const dialFit = fitText({ text: dial, boxW: 250, maxPx: 74, minPx: 30, maxLines: 2, lineHeight: 0.95, ls: -0.03 });
  const ctaFit = fitText({ text: cta, boxW: 1500, maxPx: 30, minPx: 19, maxLines: 1, ls: 0.08 });

  return (
    <div className="absolute inset-0 z-10 select-none">
      <WorkbenchTexture opacity={0.04} />
      <div className="relative flex h-full flex-col" style={{ padding: "110px 64px 64px" }}>
        {/* ── header ── */}
        <div className="flex-none">
          {eyebrow && (
            <div className="sg-anim sg-fade-down mb-2 flex items-center gap-3" style={d.style(0)}>
              <span style={{ width: 12, height: 24, background: p.pop }} />
              <Stencil color={p.pop} size={18}>{eyebrow}</Stencil>
            </div>
          )}
          {headline && (
            <div
              className="sg-anim sg-fade-up font-black uppercase"
              style={{ ...d.style(1), color: "#ffffff", fontSize: head.px, lineHeight: 0.96, letterSpacing: "-0.03em", textWrap: "balance", overflowWrap: "anywhere" }}
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

        {/* ── dial + steps ── */}
        <div className="mt-5 grid min-h-0 flex-1" style={{ gridTemplateColumns: "minmax(0,0.44fr) minmax(0,0.56fr)", gap: 36 }}>
          <A d={d} i={3} cls="sg-scale-in" className="min-h-0">
            <div
              className="flex h-full flex-col items-center justify-center overflow-hidden"
              style={{ background: p.accent, color: p.accentInk, borderRadius: 20, padding: "22px 30px", boxShadow: `0 18px 44px ${p.deep}55` }}
            >
              <Stencil color={p.accentInk} size={16} style={{ opacity: 0.8 }}>COLLECT IN</Stencil>
              <div className="relative mt-2 flex items-center justify-center">
                <Stopwatch size={286} face="#ffffff" ink={INK} accent={p.accent} />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="sg-display text-center" style={{ width: 190, color: INK, fontSize: dialFit.px, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
                    {dial}
                  </div>
                </div>
              </div>
              {description && (
                <p style={{ color: p.accentInk, opacity: 0.92, fontSize: 18, lineHeight: 1.35, textAlign: "center", margin: "10px 0 0", ...clamp(3) }}>
                  {description}
                </p>
              )}
            </div>
          </A>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
              {steps.length === 0 && (
                <div className="rounded-xl p-5" style={{ border: `2px dashed ${p.accent}66`, color: "#9aa7b8", fontSize: 20 }}>
                  Add the collection steps in the Rows editor — order, pick, collect.
                </div>
              )}
              {steps.map((step, i) => (
                <A key={i} d={d} i={4 + i} cls="sg-slide-l" className="min-w-0">
                  <div className="flex items-center gap-4" style={{ background: "#16202b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 16px" }}>
                    <span
                      className="grid flex-none place-items-center font-black"
                      style={{ width: 50, height: 50, background: p.pop, color: p.popInk, fontSize: 22, borderRadius: 6, letterSpacing: "-0.02em" }}
                    >
                      {stepLabel(i)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div style={{ color: "#f8fafc", fontSize: 25, fontWeight: 900, lineHeight: 1.12, ...clamp(1) }}>{step.name}</div>
                      {step.desc && <div style={{ color: "#93a1b2", fontSize: 18, marginTop: 2, ...clamp(1) }}>{step.desc}</div>}
                    </div>
                    {step.tag && (
                      <span
                        className="flex-none font-black uppercase"
                        style={{ background: "rgba(255,255,255,0.1)", color: p.pop, padding: "5px 10px", borderRadius: 4, fontSize: 14, letterSpacing: "0.06em", whiteSpace: "nowrap" }}
                      >
                        {step.tag}
                      </span>
                    )}
                  </div>
                </A>
              ))}
            </div>

            {image && (
              <A d={d} i={9} cls="sg-fade" className="flex-none" style={{ height: 168 }}>
                <div className="h-full overflow-hidden" style={{ borderRadius: 12, border: `2px solid ${p.accent}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" draggable={false} />
                </div>
              </A>
            )}
          </div>
        </div>

        {/* ── bottom promise strip ── */}
        {cta && (
          <div className="sg-anim sg-fade-up mt-4 flex flex-none items-center justify-center" style={{ ...d.style(10), background: p.pop, color: p.popInk, borderRadius: 8, padding: "14px 24px", minHeight: 66 }}>
            <span className="text-center font-black uppercase" style={{ fontSize: ctaFit.px, letterSpacing: "0.08em", lineHeight: 1.1, ...clamp(1) }}>
              {cta}
            </span>
          </div>
        )}
        <div className="mt-2 flex flex-none items-center" style={{ color: MUTED, fontSize: 14 }}>
          <Stencil size={13} color="#7c8798">ORDER ANYTIME · COLLECT FROM THE TRADE COUNTER</Stencil>
        </div>
      </div>
    </div>
  );
}
