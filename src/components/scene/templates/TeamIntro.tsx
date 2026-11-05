import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows } from "./brandKit";

/**
 * Template "team-intro" — Corporate · Meet the team.
 *
 * Staff cards: a round photo (or the person's initials until there is one), their name and role.
 * Up to eight people; four or fewer sit in one row, more fill two.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "EASYGATES · THE PEOPLE"
 * - headline    = the board title, e.g. "MEET THE TEAM"
 * - subheadline = one line under the headline
 * - ctaText     = optional button at the bottom, e.g. "WE'RE HIRING — ASK AT RECEPTION"
 * - items[]     = the people, up to eight:
 *   - name  = their name
 *   - desc  = their role
 *   - image = their photo (square or portrait; it is cropped to a circle)
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s'-]/gu, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] || "" : "")).toUpperCase();
}

export default function TeamIntroTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 8);
  const totalW = 1920 - MARGIN * 2;
  const n = items.length;
  const cols = n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4;
  const gap = 24;
  const cardW = Math.floor((totalW - gap * (cols - 1)) / cols);
  const rowCount = Math.max(1, Math.ceil(n / cols));
  const avatar = rowCount > 1 ? 112 : 150;
  const textW = cardW - avatar - 3 * 24;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 30 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={88} min={40} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)", gap, alignContent: "stretch", maxHeight: rowCount * 270 + (rowCount - 1) * gap }}>
        {n ? (
          items.map((it, i) => (
            <A key={i} d={d} i={3 + i} cls="sg-scale-in" style={{ minHeight: 0 }}>
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "0 24px",
                  borderRadius: 28,
                  background: alpha(k.text, k.dark ? 0.07 : 0.045),
                  border: `1px solid ${k.line}`,
                  boxShadow: k.dark ? "0 16px 36px rgba(0,0,0,0.28)" : "0 12px 28px rgba(15,23,42,0.08)",
                }}
              >
                <span style={{ flex: "none", width: avatar, height: avatar, borderRadius: 999, overflow: "hidden", display: "grid", placeItems: "center", background: i % 2 ? k.solid2 : k.solid, color: i % 2 ? k.solid2Ink : k.solidInk, border: `4px solid ${k.accent}`, boxSizing: "border-box" }}>
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <span style={{ fontSize: avatar * 0.38, fontWeight: 900, letterSpacing: "0.02em" }}>{initials(it.name)}</span>
                  )}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: fitPx(it.name, textW, 44, 24, 2), fontWeight: 900, lineHeight: 1.06, color: k.text, overflowWrap: "break-word" }}>{it.name}</span>
                  {it.desc ? <span style={{ display: "block", marginTop: 6, fontSize: fitPx(it.desc, textW, 28, 20, 2, 0), fontWeight: 700, lineHeight: 1.2, color: k.accent, overflowWrap: "break-word" }}>{it.desc}</span> : null}
                </span>
              </div>
            </A>
          ))
        ) : (
          <span style={{ fontSize: 30, color: k.muted }}>Add the team in the editor — one row per person, with a photo if you have one.</span>
        )}
      </div>

      {scene.ctaText ? <CtaBar scene={scene} d={d} k={k} i={12} width={1100} /> : null}
    </div>
  );
}
