import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, bullets, columnCount, columnWidth, kit, radiusFor, rows, type Kit } from "./brandKit";

/**
 * Template "ss-package-cards" — Smart & Secure · Security Packages.
 *
 * Three soft-edged package cards: photo, name, a big price, the kit list ticked
 * underneath, and an "installed by us" strip at the foot. The package named in
 * `discountBadge` is lifted out as the recommended one.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "SMART & SECURE · CCTV & ALARMS"
 * - headline       = the board title, e.g. "SECURITY THAT SUITS YOUR HOME"
 * - subheadline    = one line under the headline
 * - description    = footnote under the cards, e.g. "Installed by our own engineers."
 * - discountBadge  = the package to highlight, e.g. "FAMILY" (matched against row names)
 * - ctaText        = button bottom-right, e.g. "BOOK A FREE SURVEY"
 * - highlightColor = second accent (the recommended card, badges and prices)
 * - items[]        = the packages, up to four:
 *   - name  = package name, e.g. "Family"
 *   - price = the price, e.g. "£1,299"
 *   - desc  = what is included, one item per line or separated by " · "
 *   - tag   = optional badge, e.g. "MOST CHOSEN"
 *   - image = optional photo of the kit
 * Not used: imageUrl, productName, prices.
 */

const GAP = 26;

function Package({
  k,
  d,
  i,
  item,
  w,
  h,
  cols,
  featured,
}: {
  k: Kit;
  d: TemplateProps["d"];
  i: number;
  item: { name: string; price?: string; desc?: string; tag?: string; image?: string };
  w: number;
  h: number | string;
  cols: number;
  featured: boolean;
}) {
  const points = bullets(item.desc, 5);
  const photoH = Math.round(Math.min(280, ((typeof h === "number" ? h : 620) - 250) * 0.5));
  const pointPx = points.length > 4 ? 23 : 26;
  const pricePx = fitPx(item.price || "", w - 60, (item.price || "").length > 7 ? 66 : 84, 40);
  const radius = radiusFor(w);

  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        flex: "none",
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        background: featured ? k.panel : alpha(k.text, k.dark ? 0.055 : 0.03),
        border: `2px solid ${featured ? k.accent2 : k.line}`,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: featured ? (k.dark ? `0 24px 60px ${alpha(k.accent2, 0.22)}` : `0 20px 48px ${alpha(k.accent2, 0.18)}`) : "none",
        animationDelay: `${150 + d.s * (2 + i)}ms`,
      }}
    >
      {item.image ? (
        <div style={{ flex: "none", padding: "16px 16px 0" }}>
          <Frame src={item.image} alt={item.name} w="100%" h={photoH} k={k} radius={radius - 8} fit="cover" />
        </div>
      ) : null}

      <div style={{ flex: "none", padding: "16px 24px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ flex: "1 1 auto", fontSize: cols > 3 ? 32 : 38, fontWeight: 900, color: k.text, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{item.name}</span>
        {item.tag ? (
          <span
            style={{
              flex: "none",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "6px 13px",
              borderRadius: 999,
              background: k.solid2,
              color: k.solid2Ink,
              whiteSpace: "nowrap",
            }}
          >
            {item.tag}
          </span>
        ) : null}
      </div>

      {item.price ? (
        <div style={{ flex: "none", padding: "0 24px" }}>
          <span className="sg-display" style={{ fontSize: pricePx, lineHeight: 1, color: featured ? k.accent2 : k.accent, letterSpacing: "-0.03em" }}>
            {item.price}
          </span>
        </div>
      ) : null}

      <div style={{ flex: "1 1 auto", minHeight: 0, padding: "14px 24px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 9 }}>
        {points.map((p, j) => (
          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ flex: "none", marginTop: 2 }}>
              <BrandIcon id="check" size={pointPx * 0.8} color={featured ? k.accent2 : k.accent} stroke={3.2} />
            </span>
            <span style={{ fontSize: pointPx, fontWeight: 700, lineHeight: 1.22, color: k.text, overflowWrap: "anywhere" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SsPackageCardsTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 4);
  const cols = columnCount(items.length || 3);
  const totalW = 1920 - MARGIN * 2;
  const w = columnWidth(totalW, cols, GAP);
  const featuredName = (scene.discountBadge || "").trim().toLowerCase();

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 24 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: GAP, alignItems: "stretch" }}>
        {items.length ? (
          items.map((it, i) => (
            <Package
              key={i}
              k={k}
              d={d}
              i={i}
              item={it}
              w={w}
              h="100%"
              cols={cols}
              featured={Boolean(featuredName) && (it.name || "").toLowerCase().includes(featuredName)}
            />
          ))
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add up to four packages in the editor — one row per package.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 24 }}>
        {scene.description ? (
          <p className="sg-anim sg-fade-up" style={{ margin: 0, flex: "1 1 auto", fontSize: 24, fontWeight: 600, color: k.muted, animationDelay: `${150 + d.s * 7}ms` }}>
            {scene.description}
          </p>
        ) : (
          <span style={{ flex: "1 1 auto" }} />
        )}
        <CtaBar scene={scene} d={d} k={k} i={7} width={700} />
      </div>
    </div>
  );
}
