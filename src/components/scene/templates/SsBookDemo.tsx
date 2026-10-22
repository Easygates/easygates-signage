import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, Panel, TOP, fitPx, rowIcon, stepLabel } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "ss-book-demo" — Smart & Secure · Book a Demo.
 *
 * An airy invitation: three numbered steps on the left, a contact card with the
 * phone number and opening hours on the right, and a showroom photo behind the
 * steps. Designed to work on either a light or a dark palette.
 *
 * FIELDS:
 * - eyebrow      = small label, e.g. "SMART & SECURE · SHOWROOM"
 * - headline     = the board title, e.g. "COME AND TRY IT BEFORE YOU BUY."
 * - subheadline  = one line under the headline
 * - productName  = the phone number, e.g. "01384 900 262"
 * - description  = the opening hours / address, e.g. "Mon–Sat · 93 Dudley Road, Halesowen"
 * - ctaText      = button bottom-left, e.g. "BOOK YOUR SLOT"
 * - imageUrl     = showroom photo, shown beside the steps
 * - items[]      = how it works, up to four steps:
 *   - name = the step, e.g. "Book a slot"
 *   - desc = detail, e.g. "Pick a time that suits you"
 *   - tag  = optional badge, e.g. "2 MINUTES"
 * Not used: prices, highlightColor.
 */

const STEP_W = 760;

function Step({ k, d, i, name, desc, tag, px }: { k: Kit; d: TemplateProps["d"]; i: number; name: string; desc?: string; tag?: string; px: number }) {
  return (
    <div className="sg-anim sg-slide-r" style={{ display: "flex", alignItems: "flex-start", gap: 20, animationDelay: `${150 + d.s * (2 + i)}ms` }}>
      <span
        style={{
          flex: "none",
          display: "grid",
          placeItems: "center",
          width: px * 2,
          height: px * 2,
          borderRadius: "50%",
          background: alpha(k.accent, k.dark ? 0.26 : 0.18),
          border: `2px solid ${k.accent}`,
        }}
      >
        <span className="sg-display" style={{ fontSize: px * 0.92, fontWeight: 900, color: k.accent, lineHeight: 1 }}>
          {stepLabel(i)}
        </span>
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0, paddingTop: 4 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: px, fontWeight: 900, color: k.text, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{name}</span>
          {tag ? (
            <span style={{ flex: "none", fontSize: Math.round(px * 0.6), fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: k.accent2, whiteSpace: "nowrap" }}>
              {tag}
            </span>
          ) : null}
        </span>
        {desc ? (
          <span style={{ display: "block", marginTop: 5, fontSize: Math.round(px * 0.76), fontWeight: 600, lineHeight: 1.26, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span>
        ) : null}
      </span>
    </div>
  );
}

export default function SsBookDemoTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 4);
  const px = items.length > 3 ? 32 : 36;
  const rightW = 1920 - MARGIN * 2 - STEP_W - 48;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={80} min={36} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 48 }}>
        {/* ── how it works ── */}
        <div style={{ flex: "none", width: STEP_W, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
          {items.length ? (
            items.map((it, i) => <Step key={i} k={k} d={d} i={i} name={it.name} desc={it.desc} tag={it.tag} px={px} />)
          ) : (
            <span style={{ fontSize: 28, color: k.muted }}>Add the steps in the editor — one row per step.</span>
          )}
          <CtaBar scene={scene} d={d} k={k} i={6} width={STEP_W} />
        </div>

        {/* ── contact card + showroom ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <Panel k={k} pad={30} radius={32} style={{ flex: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", color: k.muted }}>Call the showroom</span>
            {scene.productName ? (
              <span className="sg-anim sg-fade-up sg-display" style={{ fontSize: fitPx(scene.productName, rightW - 90, 74, 36), lineHeight: 1, color: k.accent, letterSpacing: "-0.01em", animationDelay: `${150 + d.s * 2}ms` }}>
                {scene.productName}
              </span>
            ) : null}
            {scene.description ? (
              <span className="sg-anim sg-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700, color: k.text, animationDelay: `${150 + d.s * 3}ms` }}>
                <BrandIcon id="pin" size={28} color={k.accent2} stroke={2.4} />
                {scene.description}
              </span>
            ) : null}
            {items.length ? (
              <span className="sg-anim sg-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 700, color: k.muted, animationDelay: `${150 + d.s * 4}ms` }}>
                <BrandIcon id={rowIcon({ name: "booking" })} size={28} color={k.accent2} stroke={2.4} />
                No appointment needed — walk in and try everything.
              </span>
            ) : null}
          </Panel>
          {scene.imageUrl ? (
            <div className="sg-anim sg-scale-in" style={{ flex: "1 1 0", minHeight: 0, animationDelay: `${150 + d.s * 5}ms` }}>
              <Frame src={scene.imageUrl} alt={scene.headline} w="100%" h="100%" k={k} radius={28} fit="cover" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
