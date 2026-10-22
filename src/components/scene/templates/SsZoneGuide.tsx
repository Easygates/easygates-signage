import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Head, MARGIN, Panel, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "ss-zone-guide" — Smart & Secure · Showroom Zone Guide.
 *
 * Wayfinding for a smart-home showroom: a giant soft-edged zone circle, the
 * zone name as the headline, and the things to try in that zone listed down the
 * side. Rounded, glowing and calm — the opposite of the EasyGates industrial wall.
 *
 * FIELDS:
 * - eyebrow      = small label, e.g. "SMART & SECURE · SHOWROOM"
 * - headline     = the zone name, e.g. "ZONE 3 · HOME CINEMA"
 * - subheadline  = one line under the headline
 * - productName  = the short label inside the circle, e.g. "3"
 * - ctaText      = button bottom-left, e.g. "ASK FOR A DEMO"
 * - items[]      = what is in this zone:
 *   - name = the display, e.g. "4K laser projector"
 *   - desc = detail, e.g. "120in screen, full surround"
 * Not used: imageUrl, description, prices, highlightColor.
 */

const CIRCLE = 420;

function ZoneRow({ k, i, name, desc, px }: { k: Kit; i: number; name: string; desc?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
        padding: `${Math.round(px * 0.38)}px 0`,
        borderBottom: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 80}ms`,
      }}
    >
      <span style={{ flex: "none", marginTop: 2, display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", background: alpha(k.accent, k.dark ? 0.24 : 0.18) }}>
        <BrandIcon id="arrow" size={19} color={k.accent} stroke={2.8} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, lineHeight: 1.16, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? <span style={{ display: "block", marginTop: 4, fontSize: Math.round(px * 0.74), fontWeight: 600, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
      </span>
    </div>
  );
}

export default function SsZoneGuideTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 6);
  const px = items.length > 4 ? 28 : 32;
  const label = (scene.productName || "").trim();
  const listW = 1920 - MARGIN * 2 - CIRCLE - 60;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={84} min={36} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 60, alignItems: "center" }}>
        {/* ── the zone circle ── */}
        <div style={{ flex: "none", width: CIRCLE, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div
            className="sg-anim sg-scale-in"
            style={{
              position: "relative",
              width: CIRCLE,
              height: CIRCLE,
              borderRadius: "50%",
              background: `radial-gradient(circle at 34% 28%, ${alpha(k.accent, k.dark ? 0.42 : 0.28)}, ${alpha(k.accent2, k.dark ? 0.2 : 0.14)} 62%, transparent 76%)`,
              border: `3px solid ${k.accent}`,
              display: "grid",
              placeItems: "center",
              boxShadow: k.dark ? `0 0 90px ${alpha(k.accent, 0.3)}` : `0 0 60px ${alpha(k.accent, 0.2)}`,
              animationDelay: `${150 + d.s}ms`,
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", inset: 26, borderRadius: "50%", border: `1px dashed ${alpha(k.text, 0.28)}` }} />
            <span style={{ textAlign: "center", padding: "0 40px" }}>
              {label ? (
                <span className="sg-display" style={{ display: "block", fontSize: fitPx(label, CIRCLE - 100, 200, 60), lineHeight: 0.92, color: k.text, letterSpacing: "-0.03em" }}>
                  {label}
                </span>
              ) : null}
              <span style={{ display: "block", marginTop: 10, fontSize: 24, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: k.accent }}>zone</span>
            </span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: k.muted, textAlign: "center" }}>Try everything</span>
        </div>

        {/* ── what is in the zone ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel k={k} pad={28} radius={32} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
            {items.length ? (
              items.map((it, i) => <ZoneRow key={i} k={k} i={2 + i} name={it.name} desc={it.desc} px={px} />)
            ) : (
              <span style={{ fontSize: 28, color: k.muted }}>Add the displays in this zone — one row per thing to try.</span>
            )}
          </Panel>
          <CtaBar scene={scene} d={d} k={k} i={3 + items.length} width={listW} />
        </div>
      </div>
    </div>
  );
}
