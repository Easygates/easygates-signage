import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, FitColumn, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows } from "./brandKit";

/**
 * Template "trustpilot-review" — Social proof · Trustpilot rating and reviews.
 *
 * The rating as one huge number with Trustpilot-style green star squares, who it is based on, and up
 * to three of the best reviews as cards. Strong for reception screens and showroom windows.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "RATED EXCELLENT ON TRUSTPILOT"
 * - headline    = the rating, e.g. "4.8" (it decides how many of the five stars are filled)
 * - subheadline = what it is based on, e.g. "Excellent · based on 1,284 reviews"
 * - description = one line of reassurance, e.g. "Independent, verified reviews from customers across the UK."
 * - ctaText     = optional button, e.g. "READ OUR REVIEWS ON TRUSTPILOT"
 * - imageUrl    = a logo shown on a white plate above the rating (yours, or Trustpilot's)
 * - items[]     = the reviews, up to three:
 *   - name  = the reviewer, e.g. "Karen H."
 *   - desc  = what they said
 *   - tag   = their stars, e.g. "★★★★★" (five stars if empty)
 *   - image = optional photo of the reviewer
 * Not used: productName, prices, highlightColor.
 */

// Trustpilot's own star colours: green for earned stars, grey for the rest
const GREEN = "#00b67a";
const EMPTY = "#dcdce6";

function StarSquare({ filled, size }: { filled: boolean; size: number }) {
  return (
    <span style={{ display: "grid", placeItems: "center", width: size, height: size, background: filled ? GREEN : EMPTY, flex: "none" }}>
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.6l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.4 6 20.7l1.3-6.6L2.4 9.5l6.7-.8z" fill="#ffffff" />
      </svg>
    </span>
  );
}

function StarRow({ count, size, gap = 6 }: { count: number; size: number; gap?: number }) {
  return (
    <span style={{ display: "inline-flex", gap }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarSquare key={i} filled={i < count} size={size} />
      ))}
    </span>
  );
}

/** "4.8" → 5, "4.3" → 4, "★★★☆☆" → 3; nothing readable → 5. */
function starCount(text: string | undefined): number {
  const t = (text || "").trim();
  const filled = (t.match(/★/g) || []).length;
  if (filled) return Math.min(5, filled);
  const n = Number.parseFloat(t.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : 5;
}

export default function TrustpilotReviewTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const reviews = rows(scene, 3);
  const rating = (scene.headline || "").trim();
  const sub = (scene.subheadline || "").trim();
  const desc = (scene.description || "").trim();
  const leftW = 800;
  const rightW = 1920 - MARGIN * 2 - leftW - 70;
  const ratingPx = fitPx(rating, 420, 300, 120, 1, -0.04);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", gap: 70 }}>
      {/* ── the rating ── */}
      <div style={{ flex: "none", width: leftW, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        {scene.eyebrow ? (
          <A d={d} i={0} cls="sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 46, height: 8, borderRadius: 99, background: GREEN, flex: "none" }} />
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: k.text }}>{scene.eyebrow}</span>
          </A>
        ) : null}

        {scene.imageUrl ? (
          <A d={d} i={1} cls="sg-scale-in" style={{ alignSelf: "flex-start" }}>
            <div style={{ display: "grid", placeItems: "center", padding: "16px 30px", borderRadius: 22, background: "#ffffff", boxShadow: "0 12px 30px rgba(0,0,0,0.28)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene.imageUrl} alt="" draggable={false} style={{ display: "block", maxWidth: 380, height: 72, width: "auto", objectFit: "contain" }} />
            </div>
          </A>
        ) : null}

        <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
          <div className="sg-mask" style={{ flex: "none" }}>
            <span className="sg-display" style={{ display: "block", fontSize: ratingPx, lineHeight: 0.88, letterSpacing: "-0.04em", color: k.text, animationDelay: `${150 + d.s}ms` }}>{rating}</span>
          </div>
          <A d={d} i={3} cls="sg-fade-up" style={{ paddingBottom: 12 }}>
            <StarRow count={starCount(rating)} size={64} gap={7} />
          </A>
        </div>

        {sub ? (
          <A d={d} i={4} cls="sg-fade-up" tag="p" style={{ margin: 0, fontSize: fitPx(sub, leftW, 44, 28, 2, 0), fontWeight: 900, lineHeight: 1.1, color: k.text }}>
            {sub}
          </A>
        ) : null}
        {desc ? (
          <A d={d} i={5} cls="sg-fade-up" tag="p" style={{ margin: 0, fontSize: 30, fontWeight: 600, lineHeight: 1.3, color: k.muted }}>
            {desc}
          </A>
        ) : null}
        {scene.ctaText ? (
          <div style={{ marginTop: 6 }}>
            <CtaBar scene={scene} d={d} k={k} i={6} width={leftW} />
          </div>
        ) : null}
      </div>

      {/* ── the reviews ── */}
      <FitColumn style={{ flex: "1 1 auto", minWidth: 0 }} innerStyle={{ gap: 22, justifyContent: "center" }}>
        {reviews.length ? (
          reviews.map((r, i) => (
            <A key={i} d={d} i={5 + i} cls="sg-fade-up">
              <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "28px 32px", borderRadius: 28, background: alpha(k.text, k.dark ? 0.08 : 0.05), border: `1px solid ${k.line}`, boxShadow: k.dark ? "0 16px 40px rgba(0,0,0,0.3)" : "0 12px 30px rgba(15,23,42,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ flex: "none", width: 60, height: 60, borderRadius: 999, overflow: "hidden", display: "grid", placeItems: "center", background: GREEN, color: "#ffffff", fontSize: 30, fontWeight: 900 }}>
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt={r.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      (r.name.trim().charAt(0) || "?").toUpperCase()
                    )}
                  </span>
                  <span style={{ minWidth: 0, flex: 1, fontSize: 32, fontWeight: 900, color: k.text, overflowWrap: "break-word" }}>{r.name}</span>
                  <StarRow count={starCount(r.tag)} size={34} gap={4} />
                </div>
                {r.desc ? <span style={{ display: "block", fontSize: fitPx(r.desc, rightW - 64, 34, 24, 3, 0), fontWeight: 600, lineHeight: 1.3, color: k.text, overflowWrap: "break-word" }}>{r.desc}</span> : null}
              </div>
            </A>
          ))
        ) : (
          <span style={{ fontSize: 30, color: k.muted }}>Add up to three reviews in the editor — reviewer, what they said, and their stars (★★★★★).</span>
        )}
      </FitColumn>
    </div>
  );
}
