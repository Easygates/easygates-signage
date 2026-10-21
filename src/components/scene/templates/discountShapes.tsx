import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { burstLines, burstPoints } from "./discountKit";

// Small inline-SVG building blocks shared by Price Drop, Multi-Buy and Clearance.
// All decorative shapes are aria-hidden and static: no animation of their own.

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** True when a flex column's children are taller than the column itself (their layout heights, so
 *  entrance animations and scaling cannot fool it). */
function columnOverflows(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement && getComputedStyle(c).position !== "absolute");
  if (!kids.length) return false;
  let sum = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.rowGap) || 0) * (kids.length - 1);
  for (const k of kids) {
    const ks = getComputedStyle(k);
    sum += k.offsetHeight + (parseFloat(ks.marginTop) || 0) + (parseFloat(ks.marginBottom) || 0);
  }
  return sum > el.clientHeight + 2;
}

/**
 * Safety net for text that came out bigger than the size estimates allowed (a wider font on the
 * player, an unusual string). Every element inside `root` marked data-fit is checked after layout; if
 * any is taller than its box, this returns a higher step (up to `max`), which the template turns into
 * smaller type. It runs before the browser paints, so nobody sees the correction.
 * `key` should change whenever the slide's text does, which starts the search again.
 */
export function useFitShrink(root: RefObject<HTMLElement | null>, key: string, max = 4): number {
  const [state, setState] = useState({ key, step: 0 });
  const step = state.key === key ? state.step : 0;
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || step >= max) return;
    const marked = Array.from(el.querySelectorAll<HTMLElement>("[data-fit]"));
    if (el.hasAttribute("data-fit")) marked.unshift(el);
    if (marked.some(columnOverflows)) setState({ key, step: step + 1 });
  });
  return step;
}

/** Starburst sticker with a message ("SAVE £2", "-40%") fitted inside. Square, `size` px. */
export function Burst({
  size = 300,
  fill,
  ink,
  rim = "#ffffff",
  text,
  spikes = 20,
  rotate = 0,
  style,
}: {
  size?: number;
  fill: string;
  ink: string;
  rim?: string;
  text: string;
  spikes?: number;
  rotate?: number;
  style?: CSSProperties;
}) {
  const lines = burstLines(text);
  const k = size / 300;
  return (
    <div className="relative" style={{ width: size, height: size, ...style }}>
      <svg width={size} height={size} viewBox="0 0 300 300" aria-hidden className="absolute inset-0" style={{ filter: "drop-shadow(0 14px 18px rgba(15,23,42,0.35))" }}>
        <polygon points={burstPoints(150, 150, 146, 128, spikes, rotate)} fill={fill} stroke={rim} strokeWidth={7} strokeLinejoin="round" />
        <circle cx="150" cy="150" r="112" fill="none" stroke={ink} strokeOpacity="0.28" strokeWidth="3" strokeDasharray="4 9" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ color: ink }}>
        {lines.map((l, i) => (
          <div key={i} className="font-black uppercase" style={{ fontSize: Math.round(l.size * k), lineHeight: 1, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shopping trolley, drawn as a stroke icon. */
export function TrolleyIcon({ size = 120, color = "#0f172a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h8l7 29h28l6-21H15" />
      <path d="M24 17l2 21M34 17l1 21M44 17l-1 21" strokeWidth="3.5" />
      <circle cx="24" cy="51" r="4.5" fill={color} />
      <circle cx="42" cy="51" r="4.5" fill={color} />
    </svg>
  );
}

/** Big hanging price tag used as artwork when a slide has no product photo. */
export function TagArt({ size = 360, fill, ink, ring }: { size?: number; fill: string; ink: string; ring: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden fill="none">
      <path d="M92 18 L178 18 Q186 18 186 26 L186 112 Q186 118 182 122 L122 182 Q116 188 110 182 L18 90 Q12 84 18 78 Z" fill={fill} />
      <circle cx="146" cy="58" r="15" fill={ring} />
      <circle cx="146" cy="58" r="8" fill={ink} fillOpacity="0.35" />
      <path d="M62 104 L96 138 M82 84 L116 118" stroke={ink} strokeOpacity="0.4" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** A run of chevrons ">>>" used to cap call-to-action strips. */
export function Chevrons({ color, height = 40, flip = false }: { color: string; height?: number; flip?: boolean }) {
  return (
    <svg width={height * 1.4} height={height} viewBox="0 0 56 40" aria-hidden fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M6 5l14 15L6 35" />
      <path d="M26 5l14 15L26 35" strokeOpacity="0.55" />
      <path d="M46 5l8 15-8 15" strokeOpacity="0.25" />
    </svg>
  );
}

/** Small downward arrow, used on the "price drop" flag. */
export function DropArrow({ size = 40, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M8 6h24v4H8z" fill={color} opacity="0.35" />
      <path d="M20 36L5 16h10V10h10v6h10z" fill={color} />
    </svg>
  );
}
