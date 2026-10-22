import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, Panel, TOP, fitPx, rowIcon } from "./brandParts";
import { kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-support-hub" — EasyGates Direct · Technical Support Hub.
 *
 * The "ring us, we'll fix it" board: the helpline as the hero, the response
 * promise underneath, and the ways to reach the team as a list of channels
 * beside it. Built for a workshop wall or a trade counter.
 *
 * FIELDS:
 * - eyebrow      = small label, e.g. "EASYGATES DIRECT · TECHNICAL SUPPORT"
 * - headline     = the board title, e.g. "STUCK ON SITE? TALK TO AN ENGINEER."
 * - subheadline  = one line under the headline
 * - productName  = the response promise, e.g. "ANSWERED IN 3 RINGS"
 * - description  = the detail line under the phone number
 * - ctaText      = button bottom-left
 * - imageUrl     = optional photo beside the channels (an engineer, the workshop)
 * - items[]      = the ways to get help:
 *   - name = the channel, e.g. "Technical helpline"
 *   - desc = detail, e.g. "Gate, barrier and door faults"
 *   - tag  = when it is open, e.g. "MON–FRI 7.30–5"
 * Not used: prices, highlightColor.
 */

const PHONE_MAX = 96;

function Channel({ k, i, name, desc, tag, px }: { k: Kit; i: number; name: string; desc?: string; tag?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
        padding: `${Math.round(px * 0.36)}px 0`,
        borderBottom: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 80}ms`,
      }}
    >
      <span style={{ flex: "none", display: "grid", placeItems: "center", width: px + 18, height: px + 18, borderRadius: 12, background: k.solid }}>
        <BrandIcon id={rowIcon({ name, tag })} size={px * 0.74} color={k.solidInk} stroke={2.3} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? <span style={{ display: "block", marginTop: 3, fontSize: Math.round(px * 0.74), fontWeight: 600, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
      </span>
      {tag ? (
        <span style={{ flex: "none", fontSize: Math.round(px * 0.62), fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: k.accent, whiteSpace: "nowrap" }}>
          {tag}
        </span>
      ) : null}
    </div>
  );
}

export default function EgSupportHubTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 5);
  const px = items.length > 4 ? 26 : 30;
  const photoH = items.length > 4 ? 170 : 200;
  const leftW = 940;
  // The phone number is the hero: it gets the biggest type that still fits.
  const phone = (scene.headline || "").trim();
  const phonePx = fitPx(phone, leftW - 40, PHONE_MAX, 44);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 24 }}>
      {scene.eyebrow ? (
        <div className="sg-anim sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 14, animationDelay: `${150}ms` }}>
          <span style={{ display: "block", width: 46, height: 8, borderRadius: 99, background: k.accent, flex: "none" }} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: k.accent }}>{scene.eyebrow}</span>
        </div>
      ) : null}

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 40 }}>
        {/* ── the helpline ── */}
        <div style={{ flex: "none", width: leftW, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          <div className="sg-mask">
            <span className="sg-display" style={{ fontSize: phonePx, lineHeight: 1, letterSpacing: "-0.02em", color: k.accent, animationDelay: `${150 + d.s}ms` }}>
              {phone}
            </span>
          </div>
          {scene.productName ? (
            <span
              className="sg-anim sg-pop"
              style={{
                alignSelf: "flex-start",
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: 12,
                background: k.solid,
                color: k.solidInk,
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                animationDelay: `${150 + d.s * 2}ms`,
              }}
            >
              {scene.productName}
            </span>
          ) : null}
          {scene.subheadline ? (
            <p className="sg-anim sg-fade-up" style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1.3, color: k.text, animationDelay: `${150 + d.s * 3}ms` }}>
              {scene.subheadline}
            </p>
          ) : null}
          {scene.description ? (
            <p className="sg-anim sg-fade-up" style={{ margin: 0, fontSize: 25, fontWeight: 600, lineHeight: 1.32, color: k.muted, animationDelay: `${150 + d.s * 4}ms` }}>
              {scene.description}
            </p>
          ) : null}
          <CtaBar scene={scene} d={d} k={k} i={6} width={leftW} />
        </div>

        {/* ── channels + photo ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel k={k} edge={k.solid2} pad={26} style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ display: "block", marginBottom: 8, fontSize: 20, fontWeight: 900, letterSpacing: "0.24em", textTransform: "uppercase", color: k.muted }}>How to reach us</span>
            {items.length ? (
              items.map((it, i) => <Channel key={i} k={k} i={3 + i} name={it.name} desc={it.desc} tag={it.tag} px={px} />)
            ) : (
              <span style={{ fontSize: 28, color: k.muted }}>Add the support channels in the editor — one row per channel.</span>
            )}
          </Panel>
          {scene.imageUrl ? (
            <div className="sg-anim sg-scale-in" style={{ flex: "none", animationDelay: `${150 + d.s * 5}ms` }}>
              <Frame src={scene.imageUrl} alt={scene.headline} w="100%" h={photoH} k={k} radius={20} fit="cover" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
