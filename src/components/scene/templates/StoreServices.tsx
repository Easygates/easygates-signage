import type { TemplateProps } from "../parts";
import type { SceneItem } from "@/lib/signage";
import { A, AREA_H, BOTTOM, Banner, INK, Icon, TOP, bannerMetrics, clamp, palette, type Pal } from "./storeBoardParts";
import { countLines, fitText, gridRows, gridSpans, serviceIcon, splitLines, cleanItems } from "./storeBoardKit";

/**
 * Template "store-services" — an information board: up to six service cards, each with its own icon.
 *
 * FIELDS:
 * - eyebrow      = small label above the headline (pill in the banner), e.g. "VALUE STORE · HERE TO HELP"
 * - headline     = the banner title, shown in capitals, e.g. "STORE SERVICES"
 * - subheadline  = text in the yellow strip under the banner, e.g. "Everything you need, in one place"
 * - ctaText      = button on the right of the yellow strip, e.g. "ASK AT CUSTOMER SERVICES" (hidden when empty)
 * - items[]      = the service cards, up to 6 (1-2 big cards, 3-4 medium, 5-6 compact)
 *   - items[].name = service title, e.g. "Click & Collect" (also picks the icon when there is no tag)
 *   - items[].desc = the details. Put each short line on its own row by separating with a new line or " · ",
 *                    e.g. "Mon–Sat 7am–10pm · Sun 8am–8pm" shows as two lines.
 *   - items[].tag  = optional ICON WORD (not shown on screen): collect, returns, hours, help, customer, delivery,
 *                    photo, pharmacy, cafe, parking, trolley, gift, key, pound, info, phone, wifi, tag, glasses, bag.
 *                    Without it the icon is chosen from words in the title (click, collect, return, hours, open,
 *                    help, customer, delivery, photo, pharmacy ...), then by position.
 * - accentColor  = colour of the icon tiles and bullets (icons turn dark or white automatically)
 * Not used: description, productName, the slide-level prices, layoutVariant, imageUrl, items[].price/image.
 */

const COL_GAP = 20;
const GRID_W = 1824;
const GRID_TOP_GAP = 18;
const GRID_BOTTOM_PAD = 8;
const BORDER = 4;
const SLACK = 6;
const LEAD_W = 112;

function tileWidth(span: number): number {
  const unit = (GRID_W - 5 * COL_GAP) / 6;
  return unit * span + COL_GAP * (span - 1);
}

type Kind = "tall" | "stack" | "side";

interface Cfg {
  kind: Kind;
  pad: number;
  icon: number;
  title: [number, number];
  line: [number, number];
}

function cfgFor(n: number, span: number): Cfg {
  if (n === 1) return { kind: "side", pad: 40, icon: 300, title: [64, 100], line: [38, 58] };
  if (n === 2) return { kind: "tall", pad: 34, icon: 250, title: [56, 84], line: [38, 54] };
  if (n === 3) return { kind: "tall", pad: 28, icon: 210, title: [46, 64], line: [34, 46] };
  if (span >= 3) return { kind: "side", pad: 22, icon: 190, title: [40, 58], line: [30, 40] };
  return { kind: "stack", pad: 18, icon: 124, title: [34, 50], line: [28, 40] };
}

interface Plan {
  cfg: Cfg;
  item: SceneItem;
  span: number;
  title: string;
  lines: string[];
  titlePx: number;
  titleFits: boolean;
  linePx: number;
  /** when the card is absurdly full: lines the final (merged) line may use, else 0 */
  tailClamp: number;
  bullets: boolean;
  icon: ReturnType<typeof serviceIcon>;
}

function planCards(items: SceneItem[], tileH: number): Plan[] {
  const n = items.length;
  const spans = gridSpans(n);
  const raw = items.map((item, i) => {
    const span = spans[i];
    const cfg = cfgFor(n, span);
    const w = tileWidth(span);
    const inner = w - 2 * cfg.pad - 2 * BORDER;
    const innerH = tileH - 2 * cfg.pad - 2 * BORDER;
    const title = (item.name || "").trim();
    const lines = splitLines(item.desc);
    const icon = serviceIcon(item.tag, item.name, i);

    // where the words go
    let titleW = inner;
    let textW = inner;
    let availH = innerH;
    let titleBoxH = 9999;
    if (cfg.kind === "stack") {
      titleW = inner - cfg.icon - 16;
      titleBoxH = cfg.icon;
    } else if (cfg.kind === "side") {
      titleW = textW = inner - cfg.icon - 28;
    } else {
      titleBoxH = 150;
    }
    const tf = fitText({ text: title, boxW: titleW, boxH: titleBoxH, maxPx: cfg.title[1], minPx: cfg.title[0], maxLines: 2, lineHeight: 1.05, ls: -0.01 });
    const titleH = Math.round(tf.lines * tf.px * 1.05);

    if (cfg.kind === "stack") availH = innerH - Math.max(cfg.icon, titleH) - 12;
    else if (cfg.kind === "side") availH = innerH - titleH - 14;
    else availH = innerH - cfg.icon - titleH - 24;

    const bullets = lines.length > 1;
    const lineW = textW - (bullets ? 30 : 0);
    // biggest text size at which every line fits the card
    let linePx = cfg.line[0];
    let found = false;
    for (let px = cfg.line[1]; px >= cfg.line[0]; px -= 2) {
      const total = lines.reduce((a, l) => a + countLines(l, px, lineW, {}), 0);
      if (total * px * 1.18 + Math.max(0, lines.length - 1) * 8 <= availH) {
        linePx = px;
        found = true;
        break;
      }
    }
    // absurdly full card: keep whole lines while they fit at the smallest size, then run the rest together
    // into one last line that ends in an ellipsis, so it is obvious that more was written
    let display = lines;
    let tailClamp = 0;
    if (!found && lines.length) {
      const lh = cfg.line[0] * 1.18;
      let remaining = availH;
      const out: string[] = [];
      for (let idx = 0; idx < lines.length; idx++) {
        const need = countLines(lines[idx], cfg.line[0], lineW, {}) * lh + 8;
        const last = idx === lines.length - 1;
        if (need <= remaining - (last ? 0 : lh + 8)) {
          out.push(lines[idx]);
          remaining -= need;
        } else {
          out.push(lines.slice(idx).join(" · "));
          tailClamp = Math.max(1, Math.floor(remaining / lh));
          break;
        }
      }
      display = out;
    }
    return { cfg, item, span, title, lines: display, titlePx: tf.px, titleFits: tf.fits, linePx, tailClamp, bullets, icon };
  });

  // cards of the same width share their text sizes
  const tBy = new Map<number, number>();
  const lBy = new Map<number, number>();
  for (const p of raw) {
    tBy.set(p.span, Math.min(tBy.get(p.span) ?? 999, p.titlePx));
    if (p.lines.length) lBy.set(p.span, Math.min(lBy.get(p.span) ?? 999, p.linePx));
  }
  return raw.map((p) => ({ ...p, titlePx: tBy.get(p.span) ?? p.titlePx, linePx: lBy.get(p.span) ?? p.linePx }));
}

function IconTile({ id, size, pal }: { id: Plan["icon"]; size: number; pal: Pal }) {
  return (
    <span
      style={{
        flex: "none",
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: pal.solid,
        boxShadow: `0 0 0 4px ${pal.navy}, 0 8px 0 4px rgba(15,23,42,0.28)`,
      }}
    >
      <Icon id={id} size={Math.round(size * 0.64)} color={pal.solidInk} stroke={1.9} />
    </span>
  );
}

function Card({ p, pal, d, delay, tileH }: { p: Plan; pal: Pal; d: TemplateProps["d"]; delay: number; tileH: number }) {
  const { cfg } = p;
  const titleEl = p.title ? (
    <div style={{ fontSize: p.titlePx, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.01em", color: INK, overflowWrap: "anywhere", ...(p.titleFits ? {} : clamp(2)) }}>{p.title}</div>
  ) : null;
  const linesEl =
    p.lines.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {p.lines.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, fontSize: p.linePx, lineHeight: 1.18, fontWeight: 700, color: INK }}>
            {p.bullets && <span style={{ flex: "none", width: 16, height: 16, marginTop: Math.round(p.linePx * 0.34), borderRadius: 999, background: pal.solid, boxShadow: `0 0 0 3px ${pal.navy}` }} />}
            <span style={{ minWidth: 0, overflowWrap: "anywhere", ...(p.tailClamp && i === p.lines.length - 1 ? clamp(p.tailClamp) : {}) }}>{l}</span>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <A
      d={d}
      i={0}
      extra={delay}
      cls="sg-fade-up"
      style={{
        gridColumn: `span ${p.span}`,
        height: tileH,
        minWidth: 0,
        overflow: "hidden",
        padding: cfg.pad,
        background: "#ffffff",
        color: INK,
        borderRadius: 26,
        border: `${BORDER}px solid ${pal.navy}`,
        boxShadow: "0 8px 0 rgba(15,23,42,0.30)",
        display: "flex",
        position: "relative",
        isolation: "isolate",
        flexDirection: cfg.kind === "side" ? "row" : "column",
        gap: cfg.kind === "side" ? 28 : cfg.kind === "tall" ? 18 : 12,
        alignItems: cfg.kind === "side" ? "center" : "stretch",
        justifyContent: cfg.kind === "tall" ? "center" : "flex-start",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", right: -18, bottom: -26, opacity: 0.07, transform: "rotate(-12deg)", pointerEvents: "none", zIndex: -1 }}>
        <Icon id={p.icon} size={Math.round(Math.min(tileH * 0.62, 420))} color={pal.solid} stroke={1.5} />
      </div>
      {cfg.kind === "stack" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
            <A d={d} i={0} extra={delay + 140} cls="sg-pop" style={{ flex: "none" }}>
              <IconTile id={p.icon} size={cfg.icon} pal={pal} />
            </A>
            {titleEl}
          </div>
          {linesEl}
        </>
      )}
      {cfg.kind === "tall" && (
        <>
          <A d={d} i={0} extra={delay + 140} cls="sg-pop" style={{ flex: "none", alignSelf: "flex-start" }}>
            <IconTile id={p.icon} size={cfg.icon} pal={pal} />
          </A>
          {titleEl}
          {linesEl}
        </>
      )}
      {cfg.kind === "side" && (
        <>
          <A d={d} i={0} extra={delay + 140} cls="sg-pop" style={{ flex: "none" }}>
            <IconTile id={p.icon} size={cfg.icon} pal={pal} />
          </A>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, flex: 1 }}>
            {titleEl}
            {linesEl}
          </div>
        </>
      )}
    </A>
  );
}

export default function StoreServicesTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const items = cleanItems(scene.items).filter((it) => it.name || it.desc).slice(0, 6);
  const n = items.length;
  const rows = gridRows(n);

  const head = bannerMetrics(scene, LEAD_W);
  const areaH = AREA_H - head.height - GRID_TOP_GAP - GRID_BOTTOM_PAD;
  const tileH = n ? Math.floor((areaH - COL_GAP * (rows.length - 1)) / rows.length) - SLACK : 0;
  const plans = planCards(items, tileH);

  return (
    <div className="absolute left-0 right-0 z-10 flex flex-col" style={{ top: TOP, bottom: BOTTOM }}>
      <Banner
        scene={scene}
        d={d}
        pal={pal}
        tone="accent"
        leadW={LEAD_W}
        lead={
          <span style={{ display: "grid", placeItems: "center", width: 96, height: 96, borderRadius: 999, background: "#ffffff", boxShadow: "0 5px 0 rgba(15,23,42,0.35)" }}>
            <Icon id="info" size={64} color={pal.navy} stroke={2.2} />
          </span>
        }
      />
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
            <Card key={i} p={p} pal={pal} d={d} delay={d.s * (3 + i)} tileH={tileH} />
          ))}
        </div>
      )}
    </div>
  );
}
