import type { TemplateProps } from "../parts";
import type { SceneItem } from "@/lib/signage";
import { A, AREA_H, BOTTOM, Banner, INK, Icon, Pic, PriceFlag, SLATE, TOP, TagFlag, bannerMetrics, clamp, palette, priceFlagHeight, priceFlagWidth } from "./storeBoardParts";
import { fitText, isRankTag, rankTone, textWidth } from "./storeBoardKit";

/**
 * Template "top-sellers" — a chart of up to 5 best sellers. The rank numerals are the stars.
 *
 * FIELDS:
 * - eyebrow      = small label above the headline (pill in the banner), e.g. "VALUE STORE · CUSTOMER FAVOURITES"
 * - headline     = the banner title, shown in capitals, e.g. "TOP 5 BEST SELLERS"
 * - subheadline  = text in the yellow strip under the banner, e.g. "Our most-loved products, this week"
 * - ctaText      = button on the right of the yellow strip, e.g. "SEE THE FULL LIST IN STORE" (hidden when empty)
 * - items[]      = the chart rows in rank order: the first row is number 1. Up to 5 are shown.
 *   - items[].name  = product name (long names wrap onto a second line)
 *   - items[].price = the price on the yellow price flag, e.g. "£3.49"
 *   - items[].desc  = optional small line under the name, e.g. "Family size"
 *   - items[].tag   = optional label such as "NEW" or "-20%" (a tag that is only a rank number, like "#1", is ignored)
 *   - items[].image = optional product photo, always shown whole (never cropped)
 * - accentColor  = colour of the eyebrow pill and the tag labels. Ranks 1-3 are always gold, silver and bronze.
 * Not used: description, productName, the slide-level prices, layoutVariant, imageUrl.
 */

const LIST_TOP_GAP = 16;
const LIST_BOTTOM_PAD = 8;
const BORDER = 4;
const LEAD_W = 112;

function Row({
  it,
  rank,
  rowH,
  d,
  delay,
  pal,
}: {
  it: SceneItem;
  rank: number;
  rowH: number;
  d: TemplateProps["d"];
  delay: number;
  pal: ReturnType<typeof palette>;
}) {
  const tone = rankTone(rank);
  const name = (it.name || "").trim();
  const price = (it.price || "").trim();
  const desc = (it.desc || "").trim();
  const tag = isRankTag(it.tag) ? "" : (it.tag || "").trim();
  const innerH = rowH - 2 * BORDER;
  const innerW = 1824 - 2 * BORDER;
  const gap = 22;

  const slabW = Math.round(rowH * 1.2);
  const numeral = Math.round(rowH * 0.86);
  const tagPx = rowH >= 130 ? 32 : 28;
  const tagW = tag ? Math.min(300, Math.round(textWidth(tag, tagPx, { upper: true }) + tagPx + 8)) : 0;

  // price flag: as big as the row allows
  const priceMax = Math.min(rowH >= 200 ? 132 : 160, Math.floor((innerH - 20) / 0.98));
  const maxPriceW = 520;
  let priceFont = 0;
  if (price) {
    priceFont = 56;
    for (let px = priceMax; px >= 56; px -= 2) {
      if (priceFlagWidth(price, px) <= maxPriceW) {
        priceFont = px;
        break;
      }
    }
  }
  const priceW = price ? Math.round(priceFlagWidth(price, priceFont)) : 0;

  // the words always get at least MIN_TEXT px; the photo takes what is left over (or is dropped if that is too little)
  const MIN_TEXT = 420;
  const reserved = slabW + gap + 40 + 2 * gap + (tagW ? tagW + gap : 0) + (priceW ? priceW + 16 + 8 : 0);
  const picH = innerH;
  let picW = it.image ? Math.min(rowH >= 200 ? 430 : 560, Math.round((picH * 16) / 9)) : 0;
  const picRoom = innerW - reserved - MIN_TEXT - 10;
  if (picW > picRoom) picW = picRoom >= 150 ? Math.floor(picRoom) : 0;
  const textW = innerW - reserved - (picW ? picW + 10 : 0);

  const descPx = rowH >= 130 ? 28 : 26;
  const nameBoxH = innerH - 14 - (desc ? Math.round(descPx * 1.2) + 2 : 0);
  // one line at a slightly smaller size reads better than two lines at the biggest size
  const nameMaxPx = Math.min(72, Math.round(rowH * 0.42));
  let nameFit = fitText({ text: name, boxW: textW, boxH: nameBoxH, maxPx: nameMaxPx, minPx: Math.max(30, Math.round(nameMaxPx * 0.72)), maxLines: 1, lineHeight: 1.06, ls: -0.01 });
  if (!nameFit.fits) nameFit = fitText({ text: name, boxW: textW, boxH: nameBoxH, maxPx: nameMaxPx, minPx: 30, maxLines: 2, lineHeight: 1.06, ls: -0.01 });
  const descLines = desc ? Math.max(1, Math.min(2, Math.floor((innerH - 14 - Math.round(nameFit.lines * nameFit.px * 1.06)) / Math.round(descPx * 1.2)))) : 0;
  const descFit = fitText({ text: desc, boxW: textW, maxPx: descPx, minPx: 22, maxLines: Math.max(1, descLines), lineHeight: 1.2 });
  // the words column is only as wide as the words, so the dotted leader gets the rest
  const nameW = name ? (nameFit.lines <= 1 ? textWidth(name, nameFit.px, { ls: -0.01 }) : textW) : 0;
  const descW = desc ? (descFit.lines <= 1 ? textWidth(desc, descFit.px) : textW) : 0;
  const colW = Math.min(textW, Math.ceil(Math.max(nameW, descW)) + 10);

  return (
    <A
      d={d}
      i={0}
      extra={delay}
      cls="sg-slide-r"
      style={{
        display: "flex",
        alignItems: "stretch",
        height: rowH,
        overflow: "hidden",
        background: "#ffffff",
        color: INK,
        borderRadius: 26,
        border: `${BORDER}px solid ${pal.navy}`,
        boxShadow: "0 7px 0 rgba(15,23,42,0.30)",
      }}
    >
      <div
        style={{
          flex: "none",
          width: slabW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, ${tone.from}, ${tone.to})`,
          color: tone.ink,
          borderRight: `${BORDER}px solid ${pal.navy}`,
        }}
      >
        <span style={{ fontSize: numeral, fontWeight: 900, lineHeight: 0.8, letterSpacing: "-0.05em" }}>{rank}</span>
      </div>

      {picW > 0 && it.image && <Pic src={it.image} alt={name || "product"} w={picW} h={picH} style={{ marginLeft: 10 }} />}

      <div style={{ flex: "none", width: colW + gap, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, paddingLeft: gap, maxHeight: "100%" }}>
        {name && (
          <div
            style={{
              fontSize: nameFit.px,
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              overflowWrap: "anywhere",
              ...(nameFit.fits ? {} : clamp(2)),
            }}
          >
            {name}
          </div>
        )}
        {desc && <div style={{ fontSize: descFit.px, lineHeight: 1.2, fontWeight: 600, color: SLATE, overflowWrap: "anywhere", ...(descFit.fits ? {} : clamp(descLines)) }}>{desc}</div>}
      </div>

      {/* dotted leader from the name to the price */}
      <div aria-hidden="true" style={{ flex: "1 1 40px", minWidth: 40, alignSelf: "center", margin: `0 ${gap}px`, borderTop: "6px dotted rgba(15,23,42,0.16)" }} />

      {tag && (
        <div style={{ flex: "none", alignSelf: "center", marginRight: gap, maxWidth: 300 }}>
          <TagFlag pal={pal} text={tag} px={tagPx} />
        </div>
      )}

      {price && (
        <A d={d} i={0} extra={delay + 200} cls="sg-price" slow style={{ flex: "none", alignSelf: "center", marginRight: 16, height: priceFlagHeight(priceFont) }}>
          <PriceFlag pal={pal} text={price} px={priceFont} />
        </A>
      )}
    </A>
  );
}

export default function TopSellersTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const items = (scene.items || []).filter((it) => it && ((it.name || "").trim() || (it.price || "").trim())).slice(0, 5);
  const n = items.length;

  const head = bannerMetrics(scene, LEAD_W);
  const areaH = AREA_H - head.height - LIST_TOP_GAP - LIST_BOTTOM_PAD;
  const gap = n > 3 ? 12 : 18;
  const maxRow = n <= 1 ? 330 : n === 2 ? 270 : n === 3 ? 214 : 176;
  const rowH = n ? Math.max(92, Math.min(maxRow, Math.floor((areaH - gap * (n - 1)) / n) - 4)) : 0;

  return (
    <div className="absolute left-0 right-0 z-10 flex flex-col" style={{ top: TOP, bottom: BOTTOM }}>
      <Banner
        scene={scene}
        d={d}
        pal={pal}
        tone="navy"
        leadW={LEAD_W}
        lead={
          <span style={{ display: "grid", placeItems: "center", width: 96, height: 96, borderRadius: 999, background: pal.pop, color: pal.popInk, boxShadow: `0 5px 0 rgba(255,255,255,0.25)` }}>
            <Icon id="trophy" size={58} color={pal.popInk} stroke={2.2} />
          </span>
        }
      />
      {n > 0 && (
        <div style={{ flex: "1 1 0", minHeight: 0, margin: `${LIST_TOP_GAP}px 48px 0`, display: "flex", flexDirection: "column", justifyContent: "center", gap, paddingBottom: LIST_BOTTOM_PAD }}>
          {items.map((it, i) => (
            <Row key={i} it={it} rank={i + 1} rowH={rowH} d={d} delay={d.s * (3 + i)} pal={pal} />
          ))}
        </div>
      )}
    </div>
  );
}
