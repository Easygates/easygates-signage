import type { TemplateProps } from "../parts";
import { clean } from "./discountKit";
import { cleanItems, fitText } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { Arrow, HazardTape, INK, Plate, Starburst, Stencil, WorkbenchTexture, counterColours } from "./tradeCounterParts";

/**
 * Template "flash-sale" — a hazard-taped event board for a short, loud sale: a giant
 * starburst percentage and the categories it applies to.
 *
 * FIELDS:
 * - eyebrow      = small mono line above the headline, e.g. "RAPIDFIX · FLASH SALE"
 * - headline     = the event title, e.g. "48-HOUR FLASH SALE"
 * - subheadline  = who it is for, e.g. "20% off power tools, fixings and workwear"
 * - description  = the small print under the subheadline
 * - promoPrice   = the big number in the starburst, e.g. "20%" or "UP TO 50%"
 * - discountBadge = the word under the big number, e.g. "OFF"
 * - ctaText      = the plate under the copy, e.g. "ENDS SUNDAY · IN STORE"
 * - items[]      = up to 4 categories included in the sale
 *   - items[].name = category, e.g. "POWER TOOLS"
 *   - items[].desc = what is in it, e.g. "Drills, saws, grinders"
 *   - items[].tag  = the percentage chip, e.g. "-20%"
 * - accentColor  = the red of the starburst and the category bars
 * - highlightColor = the hazard-tape yellow
 * Not used: imageUrl, productName, originalPrice — the event is the message, not a single product.
 */
export default function FlashSaleTemplate({ scene, d }: TemplateProps) {
  const p = counterColours(scene);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const description = clean(scene.description);
  const big = clean(scene.promoPrice) || clean(scene.discountBadge) || "SALE";
  const small = clean(scene.promoPrice) && clean(scene.discountBadge) ? clean(scene.discountBadge) : clean(scene.promoPrice) ? "OFF" : "";
  const cta = clean(scene.ctaText);
  const items = cleanItems(scene.items).slice(0, 4);

  const head = fitText({ text: headline, boxW: 940, maxPx: 112, minPx: 58, maxLines: 2, lineHeight: 0.94, ls: -0.03 });
  const subFit = fitText({ text: sub, boxW: 940, maxPx: 30, minPx: 22, maxLines: 2 });
  const bigFit = fitText({ text: big, boxW: 340, maxPx: 128, minPx: 54, maxLines: 1, ls: -0.05 });
  const ctaFit = fitText({ text: cta, boxW: 760, maxPx: 26, minPx: 17, maxLines: 1, ls: 0.05 });

  return (
    <div className="absolute inset-0 z-10 select-none">
      <WorkbenchTexture opacity={0.05} />
      <div className="relative flex h-full flex-col" style={{ padding: "104px 0 56px" }}>
        <HazardTape height={46} color={p.pop} background={INK} stripe={34} style={{ marginBottom: 30 }} />

        <div className="flex min-h-0 flex-1 flex-col" style={{ padding: "0 64px" }}>
          <div className="grid min-h-0 flex-1 items-center" style={{ gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 48 }}>
            {/* ── words ── */}
            <div className="flex min-w-0 flex-col gap-4">
              {eyebrow && (
                <div className="sg-anim sg-fade-down flex items-center gap-3" style={d.style(0)}>
                  <span style={{ width: 12, height: 26, background: p.pop }} />
                  <Stencil color={p.pop} size={19}>{eyebrow}</Stencil>
                </div>
              )}
              {headline && (
                <div
                  className="sg-anim sg-fade-up font-black uppercase"
                  style={{ ...d.style(1), color: "#ffffff", fontSize: head.px, lineHeight: 0.94, letterSpacing: "-0.03em", textWrap: "balance", overflowWrap: "anywhere" }}
                >
                  {headline}
                </div>
              )}
              {sub && (
                <p className="sg-anim sg-fade-up" style={{ ...d.style(2), color: "#d7dee8", fontSize: subFit.px, lineHeight: 1.25, margin: 0, ...clamp(2) }}>
                  {sub}
                </p>
              )}
              {description && (
                <p className="sg-anim sg-fade" style={{ ...d.style(3), color: "#93a1b2", fontSize: 20, lineHeight: 1.4, margin: 0, ...clamp(2) }}>
                  {description}
                </p>
              )}
              {cta && (
                <div className="sg-anim sg-pop mt-1" style={d.style(4)}>
                  <Plate background={p.accent} color={p.accentInk} style={{ fontSize: ctaFit.px }}>
                    {cta}
                    <Arrow color={p.accentInk} size={22} />
                  </Plate>
                </div>
              )}
            </div>

            {/* ── starburst ── */}
            <div className="grid min-h-0 place-items-center">
              <div className="sg-anim sg-pop relative" style={{ ...d.style(2), animationDuration: "750ms", transform: "rotate(-4deg)" }}>
                <div style={{ filter: `drop-shadow(0 18px 0 ${p.deep})` }}>
                  <Starburst size={430} fill={p.accent} spokes={18} />
                </div>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center" style={{ color: p.accentInk }}>
                    <div className="font-black uppercase" style={{ fontSize: 24, letterSpacing: "0.3em", lineHeight: 1 }}>UP TO</div>
                    <div className="sg-display" style={{ fontSize: bigFit.px, lineHeight: 0.9, letterSpacing: "-0.05em", marginTop: 6 }}>{big}</div>
                    {small && (
                      <div className="font-black uppercase" style={{ fontSize: 38, letterSpacing: "0.14em", lineHeight: 1, marginTop: 4 }}>{small}</div>
                    )}
                  </div>
                </div>
                <div
                  className="absolute font-black uppercase"
                  style={{
                    right: -26,
                    top: 18,
                    background: p.pop,
                    color: p.popInk,
                    fontSize: 18,
                    letterSpacing: "0.12em",
                    padding: "7px 14px",
                    transform: "rotate(8deg)",
                    boxShadow: "0 5px 0 rgba(0,0,0,0.35)",
                  }}
                >
                  Trade only
                </div>
              </div>
            </div>
          </div>

          {/* ── categories ── */}
          {items.length > 0 && (
            <div className="mt-2 grid flex-none" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`, gap: 16 }}>
              {items.map((it, i) => (
                <A key={i} d={d} i={6 + i} cls="sg-fade-up" className="min-w-0">
                  <div
                    className="flex h-full items-center justify-between gap-3"
                    style={{ background: "#16202b", borderLeft: `6px solid ${p.accent}`, borderRadius: 6, padding: "12px 14px" }}
                  >
                    <div className="min-w-0">
                      <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", ...clamp(1) }}>{it.name}</div>
                      {it.desc && <div style={{ color: "#8b98a8", fontSize: 16, marginTop: 4, ...clamp(1) }}>{it.desc}</div>}
                    </div>
                    {it.tag && (
                      <span
                        className="flex-none font-black"
                        style={{ background: p.pop, color: p.popInk, padding: "6px 10px", borderRadius: 4, fontSize: 19, letterSpacing: "0.03em", whiteSpace: "nowrap" }}
                      >
                        {it.tag}
                      </span>
                    )}
                  </div>
                </A>
              ))}
            </div>
          )}
        </div>

        <HazardTape height={18} color={p.pop} background={INK} stripe={22} style={{ marginTop: 22 }} />
      </div>
    </div>
  );
}
