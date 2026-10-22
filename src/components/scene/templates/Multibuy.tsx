import { useRef } from "react";
import type { TemplateProps } from "../parts";
import { contrast, luminance, mixHex } from "@/lib/color";
import { Chevrons, TagArt, TrolleySticker, useFitShrink } from "./discountShapes";
import { INK, INK_SOFT, WHITE, cardWidth, clean, discountPalette, fitBlock, fitLine, pickScale, scaleSizes, stepScale, textEm } from "./discountKit";

/**
 * Template "multibuy": a huge offer lockup ("3 FOR £10", "BUY 2 GET 1 FREE") above one to three
 * product cards, on the 1920x1080 canvas.
 *
 * FIELDS:
 *  - eyebrow = small line above the offer, shown in a white pill (shop or campaign name)
 *  - headline = THE OFFER, the hero lockup in giant type on the coloured flag, e.g. "3 FOR £10" (keep it short; long text is shrunk to fit)
 *  - subheadline = one line under the offer on the yellow ribbon, e.g. "Mix and match any three"
 *  - description = optional sentence in a white panel at the bottom, for the small print or detail
 *  - items = the products, up to 3 cards (1 or 2 are centred). Each item uses:
 *      items[].name = product name (needed for a card to show)
 *      items[].price = the price on the coloured price tag over the picture; hidden if empty
 *      items[].image = product photo, shown whole (never cropped) on the white card; cards without one get a price-tag drawing
 *      items[].tag = optional small corner ribbon on the card, e.g. "NEW" or "BEST SELLER"; hidden if empty
 *  - ctaText = the call-to-action strip at the bottom, e.g. "MIX & MATCH IN STORE"
 *  - accentColor = the offer flag and price tags (any colour works; text colours are chosen to stay readable)
 *  - bgFrom / bgTo / bgImageUrl / theme = only visible around the cards, never behind any text
 */

const COLOURS = { contrast, luminance, mixHex };
const ROOM = 1776;
const GAP = 40;
const TOP = 112;
const BOTTOM = 70;
const BANNER_TEXT_W = 1200;
// the sticker hangs this far left of the banner (its width minus the 54px it overlaps)
const STICKER_ROOM = 178;

export default function MultibuyTemplate({ scene, d }: TemplateProps) {
  const p = discountPalette(scene.accentColor, COLOURS);
  const eyebrow = clean(scene.eyebrow);
  const offer = clean(scene.headline);
  const sub = clean(scene.subheadline);
  const desc = clean(scene.description);
  const cta = clean(scene.ctaText);
  const items = (scene.items || []).filter((it) => it && (clean(it.name) || clean(it.image) || clean(it.price))).slice(0, 3);
  const anyImage = items.some((it) => clean(it.image));
  const n = items.length;
  const anyPrice = items.some((it) => clean(it.price));

  const w = cardWidth(n, ROOM, GAP, n === 1 ? 700 : n === 2 ? 640 : 560);
  const inner = w - 56;

  // ── how big can everything be? (estimated heights; shrinks step by step until it fits) ──
  const bottomRow = Boolean(desc || cta);
  const descFit = fitBlock(desc || "", { width: cta ? 900 : 1640, maxLines: 3, sizes: [32, 30, 28, 26] });
  const ctaFit = fitBlock(cta || "", { width: desc ? 700 : 1480, maxLines: 2, sizes: [38, 34, 30, 26], tracking: 0.06 });
  const descH = desc ? Math.ceil(descFit.lines * descFit.size * 1.28) + 32 : 0;
  const ctaH = cta ? Math.max(78, Math.ceil(ctaFit.lines * ctaFit.size * 1.1) + 20) : 0;
  const rowH = bottomRow ? Math.max(descH, ctaH) + 28 : 0;
  const plan = (k: number) => {
    const offerFit = fitBlock(offer || "", { width: BANNER_TEXT_W, maxLines: 3, maxHeight: 290, sizes: scaleSizes([220, 200, 180, 160, 150, 140, 120, 104, 92, 80, 70, 64], k, 64), lineHeight: 0.95, tracking: -0.04 });
    const bannerH = offer ? Math.ceil(offerFit.lines * offerFit.size * 0.95 + offerFit.size * 0.24) + 14 : 0;
    const bannerW = Math.min(1420, (offerFit.lines > 1 ? BANNER_TEXT_W : Math.ceil(textEm(offer || "", -0.04) * offerFit.size)) + 198);
    // the ribbon should be one line if it can be (down to 32px), otherwise two
    const subWidth = Math.max(480, bannerW - 80);
    const subOne = fitBlock(sub || "", { width: subWidth, maxLines: 1, sizes: scaleSizes([44, 40, 36, 34, 32], k, 30) });
    const subFit = subOne.lines <= 1 ? subOne : fitBlock(sub || "", { width: subWidth, maxLines: 2, sizes: scaleSizes([44, 40, 36, 32, 28], k, 28) });
    const subH = sub ? Math.ceil(subFit.lines * subFit.size * 1.12) + 20 : 0;
    const nameFit = items.map((it) => fitBlock(it.name || "", { width: inner, maxLines: 2, sizes: scaleSizes([anyImage ? 36 : anyPrice ? 44 : 56, 34, 31, 28], k, 26), tracking: -0.02 }));
    const nameSize = Math.min(...nameFit.map((f) => f.size), 60);
    const nameLines = Math.max(...nameFit.map((f) => f.lines), 1);
    const priceSize = Math.min(...items.map((it) => fitLine(it.price || "", inner - 56, anyImage ? (n >= 3 ? 56 : 64) : 96, 40, -0.04)), 96);
    const nameH = Math.ceil(nameLines * nameSize * 1.08);
    const bodyH = anyImage ? 14 + nameH + 18 : 30 + nameH + (anyPrice ? 12 + priceSize + 14 : 0) + 30;
    const lockH = (eyebrow ? 62 : 6) + bannerH + (sub ? subH - 8 : 0);
    const cardsAvail = 1080 - TOP - BOTTOM - lockH - rowH - (offer ? (sub ? 36 : 34) : 10);
    return { offerFit, subFit, nameSize, priceSize, need: (anyImage ? 150 : 0) + bodyH, avail: cardsAvail };
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const step = useFitShrink(rootRef, JSON.stringify([scene.id, eyebrow, offer, sub, desc, cta, items]));
  const P = plan(stepScale(pickScale((kk) => plan(kk).need - plan(kk).avail, 0), step));

  return (
    <div ref={rootRef} data-fit data-fit-step={step} className="absolute inset-0 z-10 flex flex-col items-center" style={{ padding: `${TOP}px 72px ${BOTTOM}px` }}>
      {eyebrow && (
        <div className="sg-anim sg-fade-down" style={d.style(0)}>
          <div className="flex items-center gap-4 font-extrabold uppercase" style={{ background: WHITE, color: INK, borderRadius: 999, padding: "8px 30px 8px 22px", fontSize: 26, letterSpacing: "0.16em", boxShadow: "0 8px 22px rgba(15,23,42,0.28)", lineHeight: 1.2 }}>
            <span className="inline-block h-[14px] w-[14px] flex-none rounded-full" style={{ background: p.main }} />
            <span style={{ overflowWrap: "anywhere" }}>{eyebrow}</span>
          </div>
        </div>
      )}

      {offer && (
        <div className="relative flex items-start justify-center" style={{ marginTop: eyebrow ? 18 : 6, maxWidth: ROOM, paddingLeft: STICKER_ROOM }}>
          <div className="flex flex-col items-start">
            <div className="relative">
              <div className="sg-anim sg-scale-in" style={d.style(2)}>
                <div style={{ filter: "drop-shadow(0 12px 0 rgba(0,0,0,0.28))" }}>
                  <div style={{ background: WHITE, padding: 7, clipPath: "polygon(0 0, calc(100% - 64px) 0, 100% 50%, calc(100% - 64px) 100%, 0 100%)" }}>
                    <div
                      className="font-black uppercase"
                      style={{
                        background: p.main,
                        color: p.mainInk,
                        fontSize: P.offerFit.size,
                        lineHeight: 0.95,
                        letterSpacing: "-0.04em",
                        padding: `${Math.round(P.offerFit.size * 0.12)}px 108px ${Math.round(P.offerFit.size * 0.12)}px 90px`,
                        clipPath: "polygon(0 0, calc(100% - 60px) 0, calc(100% - 1px) 50%, calc(100% - 60px) 100%, 0 100%)",
                        textWrap: "balance",
                        overflowWrap: "anywhere",
                        maxWidth: 1420,
                        textShadow: "0 5px 0 rgba(0,0,0,0.2)",
                      }}
                    >
                      {offer}
                    </div>
                  </div>
                </div>
              </div>
              {/* trolley sticker: as tall as the banner allows, overlapping its left end */}
              <div className="absolute z-10 flex justify-end" style={{ right: "calc(100% - 54px)", top: 0, bottom: 0, width: 232, padding: "15px 0" }}>
                <div className="sg-float" style={{ height: "100%" }}>
                  <div className="sg-anim sg-pop flex items-center" style={{ ...d.style(1), animationDuration: "650ms", height: "100%" }}>
                    <div className="flex items-center" style={{ transform: "rotate(-8deg)", height: "100%" }}>
                      <TrolleySticker fill={p.pop} ink={p.popInk} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {sub && (
              <div className="sg-anim sg-fade-up" style={{ ...d.style(3), width: 0, minWidth: "100%", marginTop: -8 }}>
                <div
                  className="inline-block font-extrabold"
                  style={{ maxWidth: "100%", background: p.pop, color: p.popInk, fontSize: P.subFit.size, lineHeight: 1.12, padding: "9px 32px 11px", borderRadius: "0 0 22px 22px", boxShadow: "0 8px 0 rgba(0,0,0,0.22)", overflowWrap: "anywhere" }}
                >
                  {sub}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── product cards ── */}
      <div className="flex min-h-0 w-full flex-1 justify-center" style={{ gap: GAP, paddingTop: offer ? (sub ? 36 : 34) : 10, alignItems: anyImage ? "stretch" : "center" }}>
        {items.map((it, i) => {
          const image = clean(it.image);
          const tag = clean(it.tag);
          const price = clean(it.price);
          const name = clean(it.name);
          const chip = price && (
            <div className="font-black" style={{ background: p.main, color: p.mainInk, fontSize: P.priceSize, lineHeight: 1, letterSpacing: "-0.04em", padding: "6px 22px 8px", borderRadius: 16, whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(0,0,0,0.25)" }}>
              {price}
            </div>
          );
          return (
            <div key={i} className="sg-anim sg-fade-up flex min-h-0 flex-col" style={{ ...d.style(4 + i), width: w }}>
              <div data-fit className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white" style={{ borderRadius: 34, boxShadow: "0 28px 60px rgba(15,23,42,0.4), 0 0 0 7px rgba(255,255,255,0.7)" }}>
                {anyImage && (
                  <div className="relative min-h-[150px] flex-1">
                    {image ? (
                      <div className="absolute inset-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={name || "product"}
                          className="absolute inset-0 h-full w-full object-contain"
                          style={{ objectPosition: scene.imagePosition || "center", padding: "12px 14px", filter: "contrast(1.12) brightness(1.07)" }}
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TagArt size={Math.min(200, w * 0.4)} fill={p.main} ink={p.mainInk} ring={p.pop} />
                      </div>
                    )}
                    {tag && (
                      <div
                        className="absolute left-0 top-0 font-black uppercase"
                        style={{ background: p.pop, color: p.popInk, fontSize: 26, lineHeight: 1.1, letterSpacing: "0.06em", padding: "9px 22px 10px 20px", borderRadius: "0 0 24px 0", maxWidth: "88%", overflowWrap: "anywhere" }}
                      >
                        {tag}
                      </div>
                    )}
                    {chip && <div className="absolute" style={{ right: 14, bottom: 14 }}>{chip}</div>}
                  </div>
                )}
                <div style={{ borderTop: anyImage ? `7px solid ${p.main}` : undefined, padding: anyImage ? "14px 28px 18px" : "30px 28px 30px" }}>
                  {!anyImage && tag && (
                    <div className="mb-3 inline-block font-black uppercase" style={{ background: p.pop, color: p.popInk, fontSize: 26, lineHeight: 1.1, letterSpacing: "0.06em", padding: "7px 18px", borderRadius: 12 }}>
                      {tag}
                    </div>
                  )}
                  {name && (
                    <div className="font-black" style={{ color: INK, fontSize: P.nameSize, lineHeight: 1.08, letterSpacing: "-0.02em", textWrap: "balance", overflowWrap: "anywhere" }}>
                      {name}
                    </div>
                  )}
                  {!anyImage && chip && <div className="inline-block" style={{ marginTop: name ? 12 : 0 }}>{chip}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bottomRow && (
        <div className="sg-anim sg-fade-up flex w-full items-stretch" style={{ ...d.style(8), gap: 28, marginTop: 28 }}>
          {desc && (
            <div className="flex flex-1 items-center font-semibold" style={{ background: WHITE, color: INK_SOFT, fontSize: descFit.size, lineHeight: 1.28, padding: "16px 34px", borderRadius: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.3)", overflowWrap: "anywhere" }}>
              {desc}
            </div>
          )}
          {cta && (
            <div
              className="flex items-center justify-center gap-6"
              style={{ flex: desc ? "0 1 auto" : "1 1 auto", maxWidth: desc ? 760 : undefined, background: p.pop, color: p.popInk, borderRadius: 24, minHeight: 78, padding: "10px 32px", boxShadow: `0 8px 0 ${p.deep}, 0 22px 40px rgba(15,23,42,0.3)` }}
            >
              {!desc && <Chevrons color={p.main} height={32} />}
              <span className="text-center font-black uppercase" style={{ fontSize: ctaFit.size, lineHeight: 1.1, letterSpacing: "0.06em", overflowWrap: "anywhere" }}>
                {cta}
              </span>
              {!desc && <Chevrons color={p.main} height={32} flip />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
