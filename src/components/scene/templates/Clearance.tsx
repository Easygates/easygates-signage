import { useRef } from "react";
import type { TemplateProps } from "../parts";
import { contrast, luminance, mixHex } from "@/lib/color";
import { Chevrons, TagArt, useFitShrink } from "./discountShapes";
import { INK, INK_SOFT, WHITE, cardWidth, clean, discountPalette, fitBlock, fitLine, lineCount, pickScale, scaleSizes, stepScale } from "./discountKit";

/**
 * Template "clearance": a red-and-yellow clearance banner above one to four price-tag cards, each led
 * by its big percentage-off tag, on the 1920x1080 canvas.
 *
 * FIELDS:
 *  - eyebrow = small line above the banner text (shop or campaign name)
 *  - headline = the banner text in giant type, e.g. "LAST CHANCE" or "CLEARANCE" (long text is shrunk to fit)
 *  - subheadline = one line under the banner text on a yellow ribbon, e.g. "Clearance prices, while stocks last"
 *  - items = the products, up to 4 tags (1 to 3 are centred). Each item uses:
 *      items[].tag = the percentage-off tag at the top of the card, e.g. "-50%" (the biggest thing on the card; hidden if empty)
 *      items[].name = product name
 *      items[].desc = small line under the name, e.g. "While stocks last" or "Only 3 left"; hidden if empty
 *      items[].price = optional price on a yellow tag (over the picture, or under the name when there are no pictures); hidden if empty
 *      items[].image = optional product photo, shown whole (never cropped); if none of the items has one, the cards have no picture area
 *  - ctaText = the call-to-action strip at the bottom, e.g. "IN STORE NOW"
 *  - accentColor = the banner and tag colour (any colour works; text colours are chosen to stay readable)
 *  - bgFrom / bgTo / bgImageUrl / theme = only visible around the cards, never behind any text
 */

const COLOURS = { contrast, luminance, mixHex };
const ROOM = 1776;
const GAP = 32;
const TOP = 112;
const BOTTOM = 70;
const TAPE = 18;

export default function ClearanceTemplate({ scene, d }: TemplateProps) {
  const p = discountPalette(scene.accentColor, COLOURS, scene.highlightColor);
  const eyebrow = clean(scene.eyebrow);
  const headline = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const cta = clean(scene.ctaText);
  const items = (scene.items || []).filter((it) => it && (clean(it.name) || clean(it.tag) || clean(it.image) || clean(it.desc))).slice(0, 4);
  const n = items.length;
  const anyImage = items.some((it) => clean(it.image));
  const anyTag = items.some((it) => clean(it.tag));
  const anyDesc = items.some((it) => clean(it.desc));
  const anyPrice = items.some((it) => clean(it.price));

  const w = cardWidth(n, ROOM, GAP, n === 1 ? 760 : n === 2 ? 640 : n === 3 ? 540 : 430);
  const inner = w - 52;
  const tape = p.mainInk === WHITE ? INK : WHITE;

  // ── how big can everything be? (estimated heights; shrinks step by step until it fits) ──
  const ctaFit = fitBlock(cta || "", { width: 1480, maxLines: 2, sizes: [38, 34, 30, 26], tracking: 0.06 });
  const ctaH = cta ? Math.max(78, Math.ceil(ctaFit.lines * ctaFit.size * 1.1) + 20) : 0;
  const plan = (k: number) => {
    const headFit = fitBlock(headline || "", { width: 1560, maxLines: 2, maxHeight: 150, sizes: scaleSizes(anyImage ? [128, 120, 112, 104, 96, 88, 80, 72, 64] : [150, 140, 128, 116, 104, 96, 88, 80, 72, 64], k, 64), lineHeight: 0.98, tracking: -0.04 });
    const subFit = fitBlock(sub || "", { width: 1320, maxLines: 2, sizes: scaleSizes([42, 38, 34, 30, 28], k, 28) });
    const eyeH = eyebrow ? lineCount(eyebrow, 26, 1640, 0.2) * 31 + 14 : 0;
    const subH = sub ? Math.ceil(subFit.lines * subFit.size * 1.12) + 20 : 0;
    const headH = headline ? headFit.height : 0;
    const padBottom = sub ? Math.round(subH / 2) + 22 : 24;
    const bannerBottom = TOP + eyeH + headH + padBottom + TAPE;
    const cardsTop = sub ? Math.max(34, Math.round(subH / 2) + 14) : 34;
    const avail = 1080 - BOTTOM - (cta ? ctaH + 26 : 0) - bannerBottom - cardsTop;

    // each tag is as big as its own card allows; every header is as tall as the tallest tag needs
    const tagFit = (text: string) => fitBlock(text, { width: inner, maxLines: 2, maxHeight: anyImage ? 150 : 210, sizes: scaleSizes(anyImage ? [150, 132, 116, 100, 88, 76, 64] : [190, 168, 148, 128, 112, 96, 80, 64], k, 52), lineHeight: 0.95, tracking: -0.05 });
    const tagFits = items.map((it) => (clean(it.tag) ? tagFit(clean(it.tag)) : null));
    const tagLinesH = Math.max(0, ...tagFits.map((f) => (f ? Math.ceil(f.lines * f.size * 0.95) : 0)));
    const nameFits = items.map((it) => fitBlock(it.name || "", { width: inner, maxLines: 2, sizes: scaleSizes([anyImage ? 36 : 44, 34, 31, 28, 26], k, 26), tracking: -0.02 }));
    const nameSize = Math.min(...nameFits.map((f) => f.size), 44);
    const nameLines = Math.max(...nameFits.map((f) => f.lines), 0);
    const descFits = items.map((it) => fitBlock(it.desc || "", { width: inner, maxLines: 2, sizes: scaleSizes([anyImage ? 24 : 28, 26, 24, 22, 20], k, 20) }));
    const descSize = Math.min(...descFits.map((f) => f.size), 28);
    const descLines = Math.max(...descFits.map((f) => f.lines), 0);
    const priceSize = Math.min(...items.map((it) => fitLine(it.price || "", inner - 48, anyImage ? (n >= 4 ? 44 : 56) : 68, 36, -0.04)), 68);

    const tagBlockH = anyTag ? tagLinesH + 42 + 16 + 9 : 0;
    const tagH = tagBlockH;
    const bodyH =
      (anyImage ? 6 + 24 : (anyTag ? 26 : 56) + 28) +
      Math.ceil(nameLines * nameSize * 1.08) +
      (anyDesc ? Math.ceil(descLines * descSize * 1.25) + 8 : 0) +
      (!anyImage && anyPrice ? 14 + priceSize + 14 : 0);
    return { headFit, subFit, subH, tagFits, tagBlockH, nameSize, descSize, priceSize, padBottom, cardsTop, need: tagH + (anyImage ? 120 : 0) + bodyH, avail };
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const step = useFitShrink(rootRef, JSON.stringify([scene.id, eyebrow, headline, sub, cta, items]));
  const P = plan(stepScale(pickScale((kk) => plan(kk).need - plan(kk).avail, 0), step));

  return (
    <div ref={rootRef} data-fit data-fit-step={step} className="absolute inset-0 z-10 flex flex-col">
      {/* ── banner ── */}
      <div className="sg-anim sg-fade-down relative z-10 flex-none" style={d.style(0)}>
        <div style={{ background: p.main, padding: `${TOP}px 72px ${P.padBottom}px`, textAlign: "center", boxShadow: "0 14px 40px rgba(15,23,42,0.35)" }}>
          {eyebrow && (
            <div className="font-extrabold uppercase" style={{ color: p.mainInk, fontSize: 26, letterSpacing: "0.2em", lineHeight: 1.2, marginBottom: 14, overflowWrap: "anywhere" }}>
              {eyebrow}
            </div>
          )}
          {headline && (
            <div
              className="font-black uppercase"
              style={{ color: p.mainInk, fontSize: P.headFit.size, lineHeight: 0.98, letterSpacing: "-0.04em", textWrap: "balance", overflowWrap: "anywhere", textShadow: "0 6px 0 rgba(0,0,0,0.2)" }}
            >
              {headline}
            </div>
          )}
        </div>
        <div style={{ height: TAPE, background: `repeating-linear-gradient(-45deg, ${p.pop} 0px, ${p.pop} 22px, ${tape} 22px, ${tape} 44px)` }} />
        {sub && (
          <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: -(Math.round(P.subH / 2) - TAPE / 2), padding: "0 72px" }}>
            <div
              className="font-extrabold"
              style={{ background: p.pop, color: p.popInk, fontSize: P.subFit.size, lineHeight: 1.12, padding: "9px 34px 11px", borderRadius: 18, maxWidth: 1400, textAlign: "center", boxShadow: "0 7px 0 rgba(0,0,0,0.25)", overflowWrap: "anywhere" }}
            >
              {sub}
            </div>
          </div>
        )}
      </div>

      {/* ── price tags ── */}
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ padding: `${P.cardsTop}px 72px 0` }}>
        <div className="flex justify-center" style={{ gap: GAP, height: anyImage ? "100%" : anyTag ? "min(100%, 560px)" : undefined, alignItems: "stretch" }}>
          {items.map((it, i) => {
            const tag = clean(it.tag);
            const name = clean(it.name);
            const desc = clean(it.desc);
            const price = clean(it.price);
            const image = clean(it.image);
            const chip = price && (
              <div className="font-black" style={{ background: p.pop, color: p.popInk, fontSize: P.priceSize, lineHeight: 1, letterSpacing: "-0.04em", padding: "6px 20px 8px", borderRadius: 14, whiteSpace: "nowrap", boxShadow: "0 7px 0 rgba(0,0,0,0.25)" }}>
                {price}
              </div>
            );
            return (
              <div key={i} className="sg-anim sg-pop flex min-h-0 flex-col" style={{ ...d.style(2 + i), width: w, animationDuration: "600ms" }}>
                <div className="flex min-h-0 flex-1 flex-col" style={{ filter: "drop-shadow(0 24px 30px rgba(15,23,42,0.38))" }}>
                  <div data-fit className="relative flex min-h-0 flex-1 flex-col bg-white" style={{ clipPath: "polygon(0 46px, 46px 0, calc(100% - 46px) 0, 100% 46px, 100% 100%, 0 100%)" }}>
                    {tag && (
                      <div className="flex items-center justify-center text-center font-black" style={{ background: p.main, color: p.mainInk, padding: "42px 20px 16px", borderBottom: `9px solid ${p.pop}`, minHeight: P.tagBlockH, flex: anyImage ? "none" : "1 1 auto" }}>
                        <span style={{ fontSize: P.tagFits[i]?.size, lineHeight: 0.95, letterSpacing: "-0.05em", textWrap: "balance", overflowWrap: "anywhere", textShadow: "0 5px 0 rgba(0,0,0,0.2)" }}>{tag}</span>
                      </div>
                    )}
                    {/* eyelet */}
                    <span className="absolute left-1/2 block rounded-full" style={{ top: 12, width: 28, height: 28, marginLeft: -14, background: tag ? "rgba(15,23,42,0.45)" : "#cbd5e1", boxShadow: tag ? "inset 0 3px 5px rgba(0,0,0,0.4), 0 0 0 5px rgba(255,255,255,0.9)" : "inset 0 3px 5px rgba(0,0,0,0.25), 0 0 0 5px #e2e8f0" }} />
                    {anyImage && (
                      <div className="relative min-h-[120px] flex-1" style={{ marginTop: anyTag && !tag ? 0 : tag ? 0 : 24 }}>
                        {image ? (
                          <div className="absolute inset-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image}
                              alt={name || "product"}
                              className="absolute inset-0 h-full w-full object-contain"
                              style={{ objectPosition: scene.imagePosition || "center", padding: "10px 14px", filter: "contrast(1.12) brightness(1.07)" }}
                              draggable={false}
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <TagArt size={Math.min(170, w * 0.4)} fill={p.main} ink={p.mainInk} ring={p.pop} />
                          </div>
                        )}
                        {chip && <div className="absolute" style={{ right: 12, bottom: 10 }}>{chip}</div>}
                      </div>
                    )}
                    <div className="flex flex-col justify-center" style={{ flex: !anyImage && !tag ? "1 1 auto" : "none", padding: anyImage ? "6px 26px 24px" : `${tag ? 26 : 40}px 26px 28px`, textAlign: "center" }}>
                      {name && (
                        <div className="font-black" style={{ color: INK, fontSize: P.nameSize, lineHeight: 1.08, letterSpacing: "-0.02em", textWrap: "balance", overflowWrap: "anywhere" }}>
                          {name}
                        </div>
                      )}
                      {desc && (
                        <div className="font-semibold" style={{ color: INK_SOFT, fontSize: P.descSize, lineHeight: 1.25, marginTop: name ? 8 : 0, overflowWrap: "anywhere" }}>
                          {desc}
                        </div>
                      )}
                      {!anyImage && chip && <div className="inline-block" style={{ marginTop: 14 }}>{chip}</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cta && (
        <div className="sg-anim sg-fade-up flex-none" style={{ ...d.style(7), padding: `26px 72px ${BOTTOM}px` }}>
          <div className="flex items-center justify-center gap-8" style={{ background: p.pop, color: p.popInk, borderRadius: 22, minHeight: 78, padding: "10px 36px", boxShadow: `0 8px 0 ${p.deep}, 0 22px 40px rgba(15,23,42,0.35)` }}>
            <Chevrons color={p.main} height={34} />
            <span className="text-center font-black uppercase" style={{ fontSize: ctaFit.size, lineHeight: 1.1, letterSpacing: "0.06em", overflowWrap: "anywhere" }}>
              {cta}
            </span>
            <Chevrons color={p.main} height={34} flip />
          </div>
        </div>
      )}
      {!cta && <div className="flex-none" style={{ height: BOTTOM }} />}
    </div>
  );
}
