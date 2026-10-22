import type { TemplateProps } from "../parts";
import type { SceneItem } from "@/lib/signage";
import { A, AREA_H, BOTTOM, Banner, INK, Pic, PriceFlag, SLATE, TOP, TagFlag, bannerMetrics, clamp, palette, priceFlagHeight, priceFlagWidth, type Pal } from "./storeBoardParts";
import { countLines, fitText, gridRows, gridSpans, textWidth, cleanItems } from "./storeBoardKit";

/**
 * Template "deals-grid" — header banner, up to six deal tiles with price flags, info strip.
 *
 * FIELDS:
 * - eyebrow      = small label above the headline (dark pill), e.g. "VALUE STORE · THIS WEEK'S DEALS"
 * - headline     = the big banner title, shown in capitals, e.g. "SIX GREAT DEALS, EVERY DAY"
 * - subheadline  = text in the yellow strip under the banner, e.g. "Ends Sunday"
 * - ctaText      = button on the right of the yellow strip, e.g. "IN STORE NOW" (hidden when empty)
 * - items[]      = the deal tiles, up to 6 (1 fills the screen, 2-3 are tall cards, 4-6 form a grid)
 *   - items[].name  = product name
 *   - items[].price = the BIG price on the yellow price flag, e.g. "£3.49"
 *   - items[].desc  = small line, e.g. "Was £4.99" (a short one sits beside the price, a long one goes under the name)
 *   - items[].tag   = the little label on the photo, e.g. "-20%", "SAVE" or "2 FOR"
 *   - items[].image = product photo, always shown whole (never cropped)
 * - accentColor  = banner and tag colour (text on it turns dark or white automatically)
 * Not used: description, productName, the slide-level prices, layoutVariant, imageUrl.
 */

const COL_GAP = 20;
const GRID_W = 1824; // 1920 minus 48px margins
const GRID_TOP_GAP = 18;
const GRID_BOTTOM_PAD = 8; // room for the tile shadows
const BORDER = 4;
const SLACK = 6; // estimates are never exact, keep a little air
const PIC_GAP = 14;
const MIN_PIC = 140; // smallest photo height worth showing in a tall card

/** Width in px of a tile that spans `span` of the 6 columns. */
function tileWidth(span: number): number {
  const unit = (GRID_W - 5 * COL_GAP) / 6;
  return unit * span + COL_GAP * (span - 1);
}

type Kind = "hero" | "top" | "wide" | "side";

interface Cfg {
  kind: Kind;
  pad: number;
  name: [number, number];
  nameLines: number;
  price: number;
  desc: number;
  tag: number;
}

function cfgFor(n: number, span: number): Cfg {
  if (n === 1) return { kind: "hero", pad: 36, name: [48, 80], nameLines: 3, price: 230, desc: 40, tag: 44 };
  if (n === 2) return { kind: "top", pad: 24, name: [36, 58], nameLines: 2, price: 170, desc: 34, tag: 38 };
  if (n === 3) return { kind: "top", pad: 20, name: [32, 46], nameLines: 2, price: 134, desc: 30, tag: 34 };
  if (span >= 3) return { kind: "wide", pad: 18, name: [32, 46], nameLines: 3, price: 124, desc: 28, tag: 34 };
  return { kind: "side", pad: 16, name: [28, 38], nameLines: 3, price: 112, desc: 26, tag: 30 };
}

/** Biggest price font (<= max) whose flag fits `avail` px; never below 56. */
function fitPrice(price: string, avail: number, max: number): number {
  for (let px = max; px >= 56; px -= 2) if (priceFlagWidth(price, px) <= avail) return px;
  return 56;
}

interface Plan {
  cfg: Cfg;
  it: SceneItem;
  span: number;
  hasImg: boolean;
  name: string;
  price: string;
  desc: string;
  tag: string;
  /** short "Was £4.99" sits beside the price flag */
  inlineDesc: boolean;
  /** the tag chip sits on the photo corner (otherwise above the name) */
  tagOnPhoto: boolean;
  priceFont: number;
  nameFont: number;
  nameFits: boolean;
  descFont: number;
  /** lines the small line may use under the name; 0 = no room, so it is left out */
  descLines: number;
  descFits: boolean;
  picW: number;
  picH: number;
}

interface Draft {
  it: SceneItem;
  span: number;
  cfg: Cfg;
  inner: number;
  innerH: number;
  name: string;
  price: string;
  desc: string;
  tag: string;
  hasImg: boolean;
  inlineDesc: boolean;
  priceFont: number;
  picW: number;
}

/** Works out every size for every tile up front so tiles in the same row are identical. */
function planTiles(items: SceneItem[], tileH: number): Plan[] {
  const n = items.length;
  const spans = gridSpans(n);

  const draft: Draft[] = items.map((it, i) => {
    const span = spans[i];
    const cfg = cfgFor(n, span);
    const w = tileWidth(span);
    const inner = w - 2 * cfg.pad - 2 * BORDER;
    const innerH = tileH - 2 * cfg.pad - 2 * BORDER;
    const name = (it.name || "").trim();
    const price = (it.price || "").trim();
    const desc = (it.desc || "").trim();
    const tag = (it.tag || "").trim();
    const hasImg = Boolean(it.image);
    const descW = desc ? textWidth(desc, cfg.desc, {}) + 6 : 0;

    let picW = 0;
    if (hasImg) {
      if (cfg.kind === "hero") picW = 880;
      else if (cfg.kind === "wide") picW = Math.min(Math.round((innerH * 16) / 9), Math.round(inner * 0.46));
    }
    // width the price flag may use
    const rowW = cfg.kind === "hero" || cfg.kind === "wide" ? inner - picW - (picW ? (cfg.kind === "hero" ? 40 : 24) : 0) : inner;
    const inlineDesc = Boolean(price) && Boolean(desc) && (cfg.kind === "top" || cfg.kind === "side") && desc.length <= 18 && priceFlagWidth(price, 90) + 20 + descW <= rowW;
    const priceFont = price ? fitPrice(price, rowW - (inlineDesc ? descW + 20 : 0), cfg.price) : 0;
    return { it, span, cfg, inner, innerH, name, price, desc, tag, hasImg, inlineDesc, priceFont, picW };
  });

  // tiles of the same width share the price size, so a row looks like a row
  const priceBySpan = new Map<number, number>();
  for (const t of draft) if (t.priceFont) priceBySpan.set(t.span, Math.min(priceBySpan.get(t.span) ?? 999, t.priceFont));

  interface Sized extends Draft {
    flagH: number;
    tagOnPhoto: boolean;
    textW: number;
    colH: number;
    descLong: boolean;
    descLineH: number;
    nameFont: number;
    nameFits: boolean;
    picH: number;
  }

  const sized: Sized[] = draft.map((t0) => {
    const { cfg } = t0;
    const priceFont = t0.price ? priceBySpan.get(t0.span) ?? t0.priceFont : 0;
    const flagH = priceFont ? priceFlagHeight(priceFont) : 0;
    // in a cramped small tile a thumbnail under ~100px tall is no use: drop the photo and give the words the room
    const photoOk = !(cfg.kind === "side" && Math.max(80, t0.innerH - flagH - 8) < 100);
    const t = { ...t0, hasImg: t0.hasImg && photoOk };
    const descLong = Boolean(t.desc) && !t.inlineDesc;
    const descLineH = Math.round(cfg.desc * 1.2);
    const descH = descLong ? descLineH + 6 : 0;
    const tagH = t.tag ? Math.round(cfg.tag * 1.45) + 6 : 0;
    let picW = t.picW;
    let picH = 0;
    let textW = t.inner;
    let colH = 9999; // height available for tag + name + desc
    let tagOnPhoto = Boolean(t.tag) && t.hasImg && cfg.kind !== "side";

    const nameFits = (w: number, h: number) =>
      fitText({ text: t.name, boxW: w, boxH: h, maxPx: cfg.name[0], minPx: cfg.name[0], maxLines: cfg.nameLines, lineHeight: 1.08, ls: -0.01 }).fits;

    if (cfg.kind === "side") {
      const rowAH = Math.max(80, t.innerH - flagH - 8);
      if (t.hasImg) {
        // widest photo that still leaves the name room; the tag goes above the name if that fits, else onto the photo
        const search = (tagInCol: boolean) => {
          const h = rowAH - (tagInCol ? tagH : 0) - descH;
          for (let pw = Math.min(Math.round((rowAH * 16) / 9), 330); pw > 170; pw -= 10) if (nameFits(t.inner - pw - PIC_GAP, h)) return pw;
          return 0;
        };
        let pw = t.tag ? search(true) : search(false);
        if (t.tag && !pw) {
          tagOnPhoto = true;
          pw = search(false);
        }
        picW = pw || 170;
        textW = t.inner - picW - PIC_GAP;
        picH = Math.min(rowAH, Math.round((picW * 9) / 16));
      }
      colH = rowAH - (t.tag && !tagOnPhoto ? tagH : 0) - descH;
    } else if (cfg.kind === "wide") {
      textW = t.hasImg ? t.inner - picW - 24 : t.inner;
      colH = t.innerH - flagH - 8 - descH - (t.tag && !tagOnPhoto ? tagH : 0);
      picH = Math.min(t.innerH, Math.round((picW * 9) / 16));
    } else if (cfg.kind === "hero") {
      textW = t.hasImg ? t.inner - picW - 40 : t.inner;
      colH = t.innerH - flagH - 22 - (descLong ? descLineH * 2 + 22 : 0) - (t.tag && !tagOnPhoto ? tagH : 0);
      picH = t.innerH;
    }

    const f = fitText({ text: t.name, boxW: textW, boxH: colH, maxPx: cfg.name[1], minPx: cfg.name[0], maxLines: cfg.nameLines, lineHeight: 1.08, ls: -0.01 });
    return { ...t, priceFont, flagH, tagOnPhoto, picW, picH, textW, colH, descLong, descLineH, nameFont: f.px, nameFits: f.fits };
  });

  // tiles of the same width share the name size and the picture size
  const nameBySpan = new Map<number, number>();
  const picBySpan = new Map<number, number>();
  for (const t of sized) {
    if (t.name) nameBySpan.set(t.span, Math.min(nameBySpan.get(t.span) ?? 999, t.nameFont));
    if (t.hasImg && t.cfg.kind === "side") picBySpan.set(t.span, Math.min(picBySpan.get(t.span) ?? 9999, t.picW));
  }

  return sized.map((t) => {
    const { cfg } = t;
    const nameFont = nameBySpan.get(t.span) ?? t.nameFont;
    let { picW, picH } = t;
    if (cfg.kind === "side" && t.hasImg) {
      picW = picBySpan.get(t.span) ?? picW;
      picH = Math.min(Math.max(80, t.innerH - t.flagH - 8), Math.round((picW * 9) / 16));
    }
    const textW = cfg.kind === "side" && t.hasImg ? t.inner - picW - PIC_GAP : t.textW;
    const nameLines = t.name ? countLines(t.name, nameFont, textW, { ls: -0.01 }) : 0;
    const nameH = Math.round(nameLines * nameFont * 1.08);
    // lines the small line may use under the name (0 = no room: it is left out rather than squashed)
    let descLines = 0;
    if (t.descLong) {
      if (cfg.kind === "top") {
        // tall card: the photo keeps at least MIN_PIC px, the small line takes what is left (up to 3 lines)
        const remainder = t.innerH - t.flagH - nameH - 8 * (1 + (nameH ? 1 : 0)) - 6;
        const wanted = countLines(t.desc, cfg.desc, t.inner, {});
        descLines = Math.max(0, Math.min(3, wanted, Math.floor((remainder - (t.hasImg ? MIN_PIC : 0)) / t.descLineH)));
      } else {
        const room = Math.floor((t.colH + t.descLineH + 6 - nameH - 6) / t.descLineH);
        descLines = Math.max(0, Math.min(cfg.kind === "side" ? 2 : cfg.kind === "hero" ? 4 : 3, room));
      }
    }
    if (cfg.kind === "top" && t.hasImg) {
      // the photo gets whatever height the text and price flag leave over
      const descH = descLines ? descLines * t.descLineH + 4 : 0;
      const gaps = 8 * (1 + (nameH ? 1 : 0)) + 6;
      picW = t.inner;
      picH = Math.max(90, t.innerH - t.flagH - nameH - descH - gaps);
    }
    // shrink the small line a little before resorting to an ellipsis
    const descBoxW = cfg.kind === "top" ? t.inner : textW;
    const df = descLines ? fitText({ text: t.desc, boxW: descBoxW, maxPx: cfg.desc, minPx: 22, maxLines: descLines, lineHeight: 1.2 }) : null;
    return {
      cfg,
      it: t.it,
      span: t.span,
      hasImg: t.hasImg,
      name: t.name,
      price: t.price,
      desc: t.desc,
      tag: t.tag,
      inlineDesc: t.inlineDesc,
      tagOnPhoto: t.tagOnPhoto,
      priceFont: t.priceFont,
      nameFont,
      nameFits: t.nameFits,
      descFont: df ? df.px : cfg.desc,
      descFits: df ? df.fits : true,
      descLines,
      picW,
      picH,
    };
  });
}

function Tile({ p, pal, d, delay, tileH }: { p: Plan; pal: Pal; d: TemplateProps["d"]; delay: number; tileH: number }) {
  const { cfg } = p;
  const tagEl = p.tag ? (
    <A
      d={d}
      i={0}
      extra={delay + 260}
      cls="sg-pop"
      style={p.tagOnPhoto ? { position: "absolute", left: 8, top: 8, zIndex: 2 } : { alignSelf: "flex-start", flex: "none" }}
    >
      <TagFlag pal={pal} text={p.tag} px={cfg.tag} />
    </A>
  ) : null;

  const nameEl = p.name ? (
    <div
      style={{
        fontSize: p.nameFont,
        lineHeight: 1.08,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: INK,
        overflowWrap: "anywhere",
        ...(p.nameFits ? {} : clamp(cfg.nameLines)),
      }}
    >
      {p.name}
    </div>
  ) : null;

  const descEl =
    p.desc && !p.inlineDesc && p.descLines > 0 ? (
      <div style={{ fontSize: p.descFont, lineHeight: 1.2, fontWeight: 600, color: SLATE, overflowWrap: "anywhere", ...(p.descFits ? {} : clamp(p.descLines)) }}>{p.desc}</div>
    ) : null;

  const priceEl =
    p.price || p.inlineDesc ? (
      <div style={{ display: "flex", alignItems: "center", gap: 20, flex: "none" }}>
        {p.price && (
          <A d={d} i={0} extra={delay + 160} cls="sg-price" slow style={{ flex: "none" }}>
            <PriceFlag pal={pal} text={p.price} px={p.priceFont} />
          </A>
        )}
        {p.inlineDesc && <div style={{ fontSize: p.descFont, fontWeight: 700, color: SLATE, lineHeight: 1.15, minWidth: 0, overflowWrap: "anywhere" }}>{p.desc}</div>}
      </div>
    ) : null;

  const pic = p.hasImg ? (
    <Pic src={p.it.image as string} alt={p.name || "product"} w={p.picW} h={p.picH} style={cfg.kind === "side" || cfg.kind === "wide" ? { alignSelf: "center" } : undefined}>
      {p.tagOnPhoto && tagEl}
    </Pic>
  ) : null;

  // text column: centred when there is room, pinned to the top (never overlapping the price) when there is not
  const textCol = (
    <div style={{ display: "flex", flex: 1, minWidth: 0, maxHeight: "100%", flexDirection: "column", gap: cfg.kind === "hero" ? 14 : 6, margin: "auto 0" }}>
      {!p.tagOnPhoto && tagEl}
      {nameEl}
      {descEl}
    </div>
  );

  return (
    <A
      d={d}
      i={0}
      extra={delay}
      cls="sg-fade-up"
      style={{
        gridColumn: `span ${p.span}`,
        display: "flex",
        flexDirection: cfg.kind === "hero" || cfg.kind === "wide" ? "row" : "column",
        justifyContent: cfg.kind === "top" && !p.hasImg ? "center" : "flex-start",
        gap: cfg.kind === "hero" ? 40 : cfg.kind === "wide" ? 24 : 8,
        height: tileH,
        minWidth: 0,
        overflow: "hidden",
        padding: cfg.pad,
        background: "#ffffff",
        color: INK,
        borderRadius: 26,
        border: `${BORDER}px solid ${pal.navy}`,
        boxShadow: "0 8px 0 rgba(15,23,42,0.30)",
      }}
    >
      {cfg.kind === "top" && (
        <>
          {pic}
          {!p.tagOnPhoto && tagEl}
          {(nameEl || descEl) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "none" }}>
              {nameEl}
              {descEl}
            </div>
          )}
          {priceEl}
        </>
      )}

      {cfg.kind === "side" && (
        <>
          <div style={{ display: "flex", flex: "1 1 0", minHeight: 0, gap: PIC_GAP, overflow: "hidden" }}>
            {pic}
            {textCol}
          </div>
          {priceEl}
        </>
      )}

      {(cfg.kind === "wide" || cfg.kind === "hero") && (
        <>
          {pic}
          <div style={{ display: "flex", flex: 1, minWidth: 0, flexDirection: "column", justifyContent: "center", gap: cfg.kind === "hero" ? 22 : 8 }}>
            {textCol}
            {priceEl}
          </div>
        </>
      )}
    </A>
  );
}

export default function DealsGridTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const items = cleanItems(scene.items).filter((it) => it.name || it.price).slice(0, 6);
  const n = items.length;
  const rows = gridRows(n);

  const head = bannerMetrics(scene);
  const areaH = AREA_H - head.height - GRID_TOP_GAP - GRID_BOTTOM_PAD;
  const tileH = n ? Math.floor((areaH - COL_GAP * (rows.length - 1)) / rows.length) - SLACK : 0;
  const plans = planTiles(items, tileH);

  return (
    <div className="absolute left-0 right-0 z-10 flex flex-col" style={{ top: TOP, bottom: BOTTOM }}>
      <Banner scene={scene} d={d} pal={pal} tone="accent" />
      {n > 0 && (
        <div
          style={{
            flex: "1 1 0",
            minHeight: 0,
            margin: `${GRID_TOP_GAP}px 48px 0`,
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gridTemplateRows: `repeat(${rows.length}, ${tileH + SLACK}px)`,
            alignContent: "start",
            gap: COL_GAP,
          }}
        >
          {plans.map((p, i) => (
            <Tile key={i} p={p} pal={pal} d={d} delay={d.s * (3 + i)} tileH={tileH} />
          ))}
        </div>
      )}
    </div>
  );
}
