import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Chip, Head, MARGIN, Panel, TOP, fitPx } from "./brandParts";
import { kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-safety-check" — EasyGates Direct · Gate Safety Compliance.
 *
 * An engineer's compliance board: a ticked checklist down the left, a big
 * compliance stamp with the regulations on the right, and the promise line
 * underneath. Hazard-tape edge and monospaced regulation numbers give it the
 * "this machine is safe" authority of a real site notice.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "EASYGATES DIRECT · GATE SAFETY"
 * - headline       = the board title, e.g. "FORCE TESTED. FULLY COMPLIANT."
 * - subheadline    = one line under the headline
 * - description    = the promise line under the checklist
 * - ctaText        = button bottom-left, e.g. "BOOK A SAFETY SURVEY"
 * - highlightColor = second accent (the stamp, tape and badges)
 * - items[]        = the checks, in the order they should be read:
 *   - name = the check, e.g. "Closing force tested & logged"
 *   - desc = detail, e.g. "Measured at 400N · recorded on the job sheet"
 *   - tag  = status badge, e.g. "PASS" / "FORCE TESTED" / "ANNUAL"
 * Not used: imageUrl, productName, prices.
 */

const STAMP = 300;

function CheckRow({ k, i, name, desc, tag, px }: { k: Kit; i: number; name: string; desc?: string; tag?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        padding: `${Math.round(px * 0.28)}px 0`,
        borderBottom: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 80}ms`,
      }}
    >
      <span style={{ flex: "none", display: "grid", placeItems: "center", width: px + 16, height: px + 16, borderRadius: 10, background: k.solid, marginTop: 2 }}>
        <BrandIcon id="check" size={px * 0.74} color={k.solidInk} stroke={3.4} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, lineHeight: 1.16, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? <span style={{ display: "block", marginTop: 2, fontSize: Math.round(px * 0.68), fontWeight: 600, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
      </span>
      {tag ? (
        <span
          style={{
            flex: "none",
            fontSize: Math.round(px * 0.58),
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: 8,
            border: `2px solid ${k.solid2}`,
            color: k.accent2,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      ) : null}
    </div>
  );
}

export default function EgSafetyCheckTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 7);
  // sized so seven checks still fit the panel without clipping
  const px = items.length > 5 ? 25 : items.length > 3 ? 30 : 35;
  const listW = 1920 - MARGIN * 2 - STAMP - 40;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={76} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 40 }}>
        {/* ── checklist ── */}
        <div style={{ flex: "none", width: listW, display: "flex", flexDirection: "column", minHeight: 0, gap: 16 }}>
          <Panel k={k} edge={k.solid} pad={26} style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {items.length ? (
              <div>
                {items.map((it, i) => (
                  <CheckRow key={i} k={k} i={2 + i} name={it.name} desc={it.desc} tag={it.tag} px={px} />
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 28, color: k.muted }}>Add the safety checks in the editor — one row per check.</span>
            )}
          </Panel>
          {scene.description ? (
            <p className="sg-anim sg-fade-up" style={{ margin: 0, fontSize: 28, fontWeight: 700, color: k.text, animationDelay: `${150 + d.s * (3 + items.length)}ms` }}>
              {scene.description}
            </p>
          ) : null}
          <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={listW} />
        </div>

        {/* ── compliance stamp ── */}
        <div style={{ flex: "none", width: STAMP, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            className="sg-anim sg-pop"
            style={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: STAMP,
              height: STAMP,
              borderRadius: "50%",
              border: `8px double ${k.solid2}`,
              background: k.panel,
              textAlign: "center",
              animationDelay: `${150 + d.s * 2}ms`,
              transform: "rotate(-6deg)",
            }}
          >
            <span style={{ display: "block" }}>
              <BrandIcon id="shield" size={64} color={k.solid2} stroke={2.4} />
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontSize: fitPx("COMPLIANT", STAMP - 70, 46, 22),
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  color: k.text,
                  lineHeight: 1,
                }}
              >
                COMPLIANT
              </span>
              <span style={{ display: "block", marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: "0.14em", color: k.muted }}>BS EN 12453</span>
            </span>
          </div>
          <div className="sg-anim sg-fade-up" style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", animationDelay: `${150 + d.s * 3}ms` }}>
            <Chip k={k} text="UKCA" fill={k.solid2} ink={k.solid2Ink} px={20} />
            <Chip k={k} text="CE" fill={k.solid2} ink={k.solid2Ink} px={20} />
            <Chip k={k} text="DHF" fill={k.solid2} ink={k.solid2Ink} px={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
