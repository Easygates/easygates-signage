import type { TemplateProps } from "../parts";
import { AREA_H, BOTTOM, BrandIcon, Chip, CtaBar, Frame, Head, MARGIN, TOP, fitPx, headHeight } from "./brandParts";
import { alpha, kit, rows, stepLabel, type Kit } from "./brandKit";

/**
 * Template "eg-fit-guide" — EasyGates Direct · Fit in Four Steps.
 *
 * A commissioning walk-through: each step is a numbered card with the job, the
 * detail and a time chip (20 MIN, 1 HOUR…). A hairline runs behind the numbers so
 * the four cards read as one process rather than four separate offers.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "EASYGATES DIRECT · FITTING"
 * - headline       = the guide title, e.g. "FROM BOX TO WORKING GATE"
 * - subheadline    = one line under the headline
 * - description    = footnote under the steps, e.g. "Two engineers, half a day — commissioning included"
 * - ctaText        = button bottom-right, e.g. "BOOK A FITTER"
 * - highlightColor = second accent (step numbers, time chips, connector line)
 * - items[]        = the steps, up to four, in order:
 *   - name = the step, e.g. "Mount the motor"
 *   - desc = how to do it, one point per line or separated by " · "
 *   - tag  = the time chip, e.g. "45 MIN"
 *   - image = optional photo illustrating the step
 * Not used: imageUrl, productName, prices.
 */

function StepCard({ k, d, i, name, desc, tag, image, w, px, photoH }: { k: Kit; d: TemplateProps["d"]; i: number; name: string; desc?: string; tag?: string; image?: string; w: number; px: number; photoH: number }) {
  const namePx = fitPx(name, w - 56, 42, 24, 2);
  const points = (desc || "").split(/\s*[\r\n]+|\s+[·•|]\s+/).map((p) => p.replace(/^[-–—]\s*/, "").trim()).filter(Boolean).slice(0, 3);

  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        flex: "none",
        position: "relative",
        zIndex: 1,
        width: w,
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "24px 22px",
        borderRadius: 20,
        background: alpha(k.text, k.dark ? 0.05 : 0.03),
        border: `1px solid ${k.line}`,
        overflow: "hidden",
        animationDelay: `${150 + i * 90}ms`,
      }}
    >
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em", color: k.accent2 }}>{stepLabel(i)}</span>
        {tag ? <Chip k={k} text={tag} fill={k.solid2} ink={k.solid2Ink} px={17} /> : null}
      </div>
      {image ? <Frame src={image} alt={name} w="100%" h={photoH} k={k} radius={12} fit="cover" /> : null}
      <span style={{ display: "block", fontSize: namePx, fontWeight: 900, lineHeight: 1.08, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
      <span style={{ flex: image ? "none" : "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        {points.map((p, j) => (
          <span key={j} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            <span style={{ flex: "none", marginTop: 3 }}>
              <BrandIcon id="check" size={px * 0.72} color={k.accent} stroke={3.2} />
            </span>
            <span style={{ fontSize: px, fontWeight: 600, lineHeight: 1.22, color: k.muted, overflowWrap: "anywhere" }}>{p}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

export default function EgFitGuideTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 4);
  const cols = Math.max(1, items.length || 4);
  const gap = 20;
  const totalW = 1920 - MARGIN * 2;
  const w = Math.floor((totalW - gap * (cols - 1)) / cols);
  const px = cols > 3 ? 23 : cols === 3 ? 25 : 28;
  // the photo takes whatever height the card has left after the number row, the title and up to three
  // points, so the cards are filled instead of ending halfway down
  const cardH = AREA_H - headHeight(scene, totalW, 72, 34) - 22 * 2 - 80;
  const photoH = Math.max(110, Math.min(300, Math.floor(cardH - 48 - 64 - 48 - 90 - 3 * (px * 1.22 + 7))));

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 22 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={72} min={34} />

      <div style={{ position: "relative", flex: "1 1 0", minHeight: 0, display: "flex", gap }}>
        {/* arrows in the gaps between the steps, level with the step numbers */}
        {items.slice(0, -1).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{ position: "absolute", zIndex: 2, left: (i + 1) * (w + gap) - gap / 2 - 18, top: 24 + 32 - 18, width: 36, height: 36, borderRadius: 99, background: k.solid2, display: "grid", placeItems: "center" }}
          >
            <BrandIcon id="arrow" size={22} color={k.solid2Ink} stroke={3} />
          </span>
        ))}
        {items.length ? (
          items.map((it, i) => <StepCard key={i} k={k} d={d} i={i} name={it.name} desc={it.desc} tag={it.tag} image={it.image} w={w} px={px} photoH={photoH} />)
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add the fitting steps in the editor — one row per step.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
        <p style={{ margin: 0, maxWidth: 1080, fontSize: 24, fontWeight: 700, lineHeight: 1.25, color: k.muted }}>{scene.description || ""}</p>
        <CtaBar scene={scene} d={d} k={k} i={5 + items.length} width={540} />
      </div>
    </div>
  );
}
