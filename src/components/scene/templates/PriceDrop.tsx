import { useRef } from "react";
import type { TemplateProps } from "../parts";
import { kbClass } from "../parts";
import { contrast, luminance, mixHex } from "@/lib/color";
import { Burst, Chevrons, DropArrow, TagArt, useFitShrink } from "./discountShapes";
import { INK, INK_SOFT, WHITE, clean, discountPalette, fitBlock, fitLine, lineCount, pickScale, scaleSizes, stepScale } from "./discountKit";

/**
 * Template "price-drop": one hero product, a huge new price and a "SAVE" sticker, laid out on the
 * 1920x1080 canvas as a solid accent-colour block (the words) beside a white product card (the picture).
 *
 * FIELDS:
 *  - eyebrow = small line above the headline (shop or campaign name), top of the coloured block
 *  - subheadline = wording on the yellow flag at the top; leave it empty and the flag says "PRICE DROP"
 *  - headline = the campaign line in big type, e.g. "BIG BOWLS. BIG SAVINGS."
 *  - productName = the product's name, printed under the picture on the white card
 *  - description = a sentence or two about the product, under the product name
 *  - originalPrice = the old "was" price, struck through above the new price (only shown when there is a new price)
 *  - promoPrice = the new price, the biggest thing on the slide (if empty, the old price is shown instead)
 *  - discountBadge = text on the round sticker over the picture, e.g. "SAVE £2" or "-40%" (keep it short, about 12 characters)
 *  - ctaText = the call-to-action strip along the bottom, e.g. "WHILE STOCKS LAST"
 *  - imageUrl = the product photo, shown whole (never cropped) on the white card; without one a price-tag drawing is shown
 *  - kenBurns = slow zoom on the product photo ("static" keeps it still)
 *  - accentColor = the colour block and price colours (any colour works; text colours are chosen to stay readable)
 *  - bgFrom / bgTo / bgImageUrl / theme = only visible around the white card, never behind any text
 */

const COLOURS = { contrast, luminance, mixHex };
const LEFT_W = 880;
// price text must fit the flag: flag max width ≈ 960 minus its padding (36 left, 108 right) and 14 of edge
const PRICE_BOX = 800;
const TOP = 112;
const BOTTOM = 70;

export default function PriceDropTemplate({ scene, d }: TemplateProps) {
  const p = discountPalette(scene.accentColor, COLOURS, scene.highlightColor);
  const eyebrow = clean(scene.eyebrow);
  const flagText = clean(scene.subheadline) || "PRICE DROP";
  const headline = clean(scene.headline);
  const name = clean(scene.productName);
  const desc = clean(scene.description);
  const promo = clean(scene.promoPrice);
  const orig = clean(scene.originalPrice);
  const price = promo || orig || "";
  const was = promo && orig ? orig : "";
  const badge = clean(scene.discountBadge);
  const cta = clean(scene.ctaText);
  const image = clean(scene.imageUrl);
  const hasCaption = Boolean(name || desc);

  // ── how big can everything be? (estimated heights; shrinks step by step until it fits) ──
  const ctaFit = fitBlock(cta || "", { width: 1480, maxLines: 2, sizes: [38, 34, 30, 26], tracking: 0.06 });
  const ctaH = cta ? Math.max(78, Math.ceil(ctaFit.lines * ctaFit.size * 1.1) + 20) : 0;
  const rowH = 1080 - TOP - BOTTOM - (cta ? ctaH + 28 : 0);
  const plan = (k: number) => {
    const headFit = fitBlock(headline || "", { width: LEFT_W, maxLines: 3, maxHeight: 300, sizes: scaleSizes([104, 98, 92, 86, 80, 74, 68, 64], k, 64), lineHeight: 1, tracking: -0.03 });
    const flagFit = fitBlock(flagText, { width: LEFT_W - 170, maxLines: 2, sizes: scaleSizes([40, 36, 32, 28], k, 28), tracking: 0.03 });
    const priceSize = fitLine(price, PRICE_BOX, Math.max(150, Math.round(300 * k)), 90, -0.04);
    const wasSize = fitLine(was, 520, Math.max(44, Math.round(64 * k)), 40, -0.02);
    const nameFit = fitBlock(name || "", { width: 700, maxLines: 2, sizes: scaleSizes([54, 48, 44, 40, 36], k, 32), tracking: -0.02 });
    const descFit = fitBlock(desc || "", { width: 700, maxLines: 4, sizes: scaleSizes([30, 28, 26], k, 26) });
    const eyeH = eyebrow ? lineCount(eyebrow, 26, LEFT_W - 64, 0.16) * 31 + 22 : 0;
    const flagH = Math.ceil(flagFit.lines * flagFit.size * 1.05) + 32;
    const priceH = price ? (was ? Math.round(wasSize * 1.1) + 6 : 0) + Math.round(priceSize * 1.2) + 14 : 0;
    const topH = eyeH + flagH + (headline ? 22 + headFit.height : 0);
    const left = topH + (price ? 12 + priceH : 0);
    const capH = hasCaption ? 8 + 22 + (name ? nameFit.height : 0) + (desc ? (name ? 10 : 0) + Math.ceil(descFit.lines * descFit.size * 1.3) : 0) + 28 : 0;
    return { headFit, flagFit, priceSize, wasSize, nameFit, descFit, need: Math.max(left, capH + (image ? 170 : 220)) };
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const step = useFitShrink(rootRef, JSON.stringify([scene.id, eyebrow, flagText, headline, name, desc, promo, orig, badge, cta, Boolean(image)]));
  const P = plan(stepScale(pickScale((k) => plan(k).need, rowH), step));
  const centred = !headline && !eyebrow;

  return (
    <div ref={rootRef} data-fit-step={step} className="absolute inset-0 z-10">
      {/* solid colour block + yellow edge: every word on the left sits on this, whatever the background */}
      <svg className="sg-anim sg-fade absolute inset-0" style={d.style(0)} width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden>
        <polygon points="0,0 1012,0 932,1080 0,1080" fill={p.main} />
        <polygon points="1012,0 1058,0 978,1080 932,1080" fill={p.pop} />
      </svg>

      <div className="absolute inset-0 flex flex-col" style={{ padding: `${TOP}px 72px ${BOTTOM}px` }}>
        <div className="flex min-h-0 flex-1" style={{ gap: 118 }}>
          {/* ── words ── */}
          <div data-fit className="flex min-h-0 flex-col" style={{ width: LEFT_W, flex: "none", justifyContent: centred ? "center" : "space-between", gap: centred ? 36 : 0 }}>
            <div className="flex flex-col items-start" style={{ gap: 22 }}>
              {eyebrow && (
                <div className="sg-anim sg-fade-down flex items-center gap-4" style={d.style(0)}>
                  <span className="inline-block h-[10px] w-[44px] flex-none rounded-full" style={{ background: p.pop }} />
                  <span className="font-extrabold uppercase" style={{ color: p.mainInk, fontSize: 26, letterSpacing: "0.16em", lineHeight: 1.2, overflowWrap: "anywhere" }}>
                    {eyebrow}
                  </span>
                </div>
              )}
              <div className="sg-anim sg-pop" style={d.style(1)}>
                <div style={{ filter: "drop-shadow(0 7px 0 rgba(0,0,0,0.3))" }}>
                  <div
                    className="flex items-center gap-4 font-black uppercase"
                    style={{
                      background: p.pop,
                      color: p.popInk,
                      fontSize: P.flagFit.size,
                      lineHeight: 1.05,
                      letterSpacing: "0.03em",
                      padding: "16px 62px 16px 28px",
                      clipPath: "polygon(0 0, 100% 0, calc(100% - 26px) 50%, 100% 100%, 0 100%)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <DropArrow size={Math.round(P.flagFit.size * 1.05)} color={p.popInk} />
                    <span>{flagText}</span>
                  </div>
                </div>
              </div>
              {headline && (
                <div
                  className="sg-anim sg-fade-up font-black"
                  style={{ ...d.style(2), color: p.mainInk, fontSize: P.headFit.size, lineHeight: 1, letterSpacing: "-0.03em", textWrap: "balance", overflowWrap: "anywhere", textShadow: "0 3px 0 rgba(0,0,0,0.18)" }}
                >
                  {headline}
                </div>
              )}
            </div>

            {price && (
              <div className="flex flex-col items-start" style={{ gap: 6 }}>
                {was && (
                  <div className="sg-anim sg-fade flex items-baseline gap-5" style={d.style(3)}>
                    <span className="font-extrabold uppercase" style={{ color: p.mainInk, fontSize: 30, letterSpacing: "0.14em" }}>
                      was
                    </span>
                    <span className="relative inline-block font-black" style={{ color: p.mainInk, fontSize: P.wasSize, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                      {was}
                      <span className="absolute left-[-6px] right-[-6px] top-1/2 block" style={{ height: 8, marginTop: -4, background: p.pop, borderRadius: 4, transform: "rotate(-7deg)" }} />
                    </span>
                  </div>
                )}
                <div className="sg-anim sg-price" style={{ ...d.style(4), animationDuration: "650ms" }}>
                  <div style={{ filter: "drop-shadow(0 14px 0 rgba(0,0,0,0.3))" }}>
                    {/* white outer shape + yellow inner shape = a flag with a white edge, so it still reads where it crosses the yellow stripe */}
                    <div style={{ background: WHITE, padding: 7, clipPath: "polygon(0 0, calc(100% - 94px) 0, 100% 50%, calc(100% - 94px) 100%, 0 100%)" }}>
                      <div
                        className="font-black"
                        style={{
                          background: p.pop,
                          color: p.popInk,
                          fontSize: P.priceSize,
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          whiteSpace: "nowrap",
                          padding: `${Math.round(P.priceSize * 0.1)}px 108px ${Math.round(P.priceSize * 0.1)}px 36px`,
                          clipPath: "polygon(0 0, calc(100% - 91px) 0, calc(100% - 1px) 50%, calc(100% - 91px) 100%, 0 100%)",
                        }}
                      >
                        {price}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── product card ── */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div
              data-fit
              className="sg-anim sg-scale-in flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
              style={{ ...d.style(2), borderRadius: 44, boxShadow: "0 36px 80px rgba(15,23,42,0.4), 0 0 0 8px rgba(255,255,255,0.7)" }}
            >
              <div className="relative min-h-[150px] flex-1">
                {image ? (
                  <div className={`absolute inset-0 ${kbClass(scene.kenBurns)}`}>
                    {/* the photo box is inset so that even the biggest Ken Burns zoom (1.18x) never pushes the product past the stage */}
                    <div className="absolute" style={{ inset: "8.5% 7%" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={name || "product"}
                        className="h-full w-full object-contain"
                        style={{ objectPosition: scene.imagePosition || "center", filter: "contrast(1.12) brightness(1.07)" }}
                        draggable={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TagArt size={Math.min(380, Math.max(160, rowH - 360))} fill={p.main} ink={p.mainInk} ring={p.pop} />
                  </div>
                )}
              </div>
              {hasCaption && (
                <div style={{ borderTop: `8px solid ${p.main}`, padding: "22px 40px 28px" }}>
                  {name && (
                    <div className="sg-anim sg-fade-up font-black" style={{ ...d.style(5), color: INK, fontSize: P.nameFit.size, lineHeight: 1.04, letterSpacing: "-0.02em", textWrap: "balance", overflowWrap: "anywhere" }}>
                      {name}
                    </div>
                  )}
                  {desc && (
                    <div className="sg-anim sg-fade-up font-semibold" style={{ ...d.style(6), color: INK_SOFT, fontSize: P.descFit.size, lineHeight: 1.3, marginTop: name ? 10 : 0, overflowWrap: "anywhere" }}>
                      {desc}
                    </div>
                  )}
                </div>
              )}
            </div>
            {badge && (
              <div className="sg-float absolute z-20" style={{ right: -38, top: 6 }}>
                <div className="sg-anim sg-pop" style={{ ...d.style(6), animationDuration: "650ms" }}>
                  <div style={{ transform: "rotate(-8deg)" }}>
                    <Burst size={300} fill={p.pop} ink={p.popInk} text={badge} rotate={4} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {cta && (
          <div className="sg-anim sg-fade-up" style={{ ...d.style(7), marginTop: 28 }}>
            <div
              className="flex items-center justify-center gap-8"
              style={{ background: p.pop, color: p.popInk, borderRadius: 22, minHeight: 78, padding: "10px 36px", boxShadow: `0 8px 0 ${p.deep}, 0 22px 40px rgba(15,23,42,0.35)` }}
            >
              <Chevrons color={p.main} height={34} />
              <span className="text-center font-black uppercase" style={{ fontSize: ctaFit.size, lineHeight: 1.1, letterSpacing: "0.06em", overflowWrap: "anywhere" }}>
                {cta}
              </span>
              <Chevrons color={p.main} height={34} flip />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
