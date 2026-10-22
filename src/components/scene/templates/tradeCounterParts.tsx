import type { CSSProperties, ReactNode } from "react";
import type { Scene } from "@/lib/signage";
import { contrast, luminance, mixHex } from "@/lib/color";
import {
  COUNTER_HAZARD,
  COUNTER_INK,
  COUNTER_MUTED,
  COUNTER_PAPER,
  COUNTER_RED,
  barcodeBars,
  counterPalette,
  starburstPoints,
  type CounterPalette,
} from "./tradeCounterKit";

// Shared building blocks for the five trade-counter templates. The look is a
// Screwfix-style trade counter: charcoal steel, off-white catalogue paper, safety
// yellow and a hard red accent, with mono part numbers and bar codes.

export const INK = COUNTER_INK;
export const PAPER = COUNTER_PAPER;
export const MUTED = COUNTER_MUTED;
export const HAZARD = COUNTER_HAZARD;
export const RED = COUNTER_RED;
export const STEEL = "#232f3d";
export const CHARCOAL = "#0b0f14";

const COLOURS = { contrast, luminance, mixHex };

/** Colours every counter template derives from the slide. */
export function counterColours(scene: Scene): CounterPalette {
  return counterPalette(scene.accentColor, scene.highlightColor, COLOURS);
}

/** Uppercase mono label — part numbers, "CAT NO.", "QTY". */
export function Stencil({
  children,
  color = "#94a3b8",
  size = 18,
  className = "",
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        color,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Diagonal hazard tape — the Screwfix-style edge stripe. */
export function HazardTape({
  height = 40,
  color = HAZARD,
  background = INK,
  stripe = 30,
  angle = 135,
  style,
}: {
  height?: number;
  color?: string;
  background?: string;
  stripe?: number;
  angle?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        height,
        flex: "none",
        background: `repeating-linear-gradient(${angle}deg, ${background} 0 ${stripe}px, ${color} ${stripe}px ${stripe * 2}px)`,
        boxShadow: `inset 0 0 0 1px ${background}22`,
        ...style,
      }}
    />
  );
}

/** Black catalogue plate: "CAT NO. RF48213". */
export function CatPlate({
  code,
  label = "CAT NO.",
  color = "#ffffff",
  style,
}: {
  code: string;
  label?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: INK,
        color,
        padding: "6px 12px",
        borderRadius: 4,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: "0.12em",
        lineHeight: 1,
        ...style,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      {code}
    </span>
  );
}

/** A barcode drawn from a product name — same product, same bars. */
export function Barcode({
  seed,
  height = 40,
  color = INK,
  unit = 3,
  gap = 2,
  bars = 40,
  style,
}: {
  seed: string;
  height?: number;
  color?: string;
  unit?: number;
  gap?: number;
  bars?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: "flex",
        alignItems: "stretch",
        gap,
        height,
        overflow: "hidden",
        ...style,
      }}
    >
      {barcodeBars(seed, bars).map((width, i) => (
        <span
          key={i}
          style={{ width: width * unit, height: "100%", background: color, flex: "none" }}
        />
      ))}
    </span>
  );
}

/** A faint workshop texture: diagonal hatch + pegboard dots. */
export function WorkbenchTexture({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, #ffffff 0 1px, transparent 1px 16px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1.6px, transparent 1.7px)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

/** A jagged burst behind the flash-sale percentage. */
export function Starburst({
  size,
  fill,
  className = "",
  style,
  spokes = 16,
}: {
  size: number;
  fill: string;
  className?: string;
  style?: CSSProperties;
  spokes?: number;
}) {
  const half = size / 2;
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
    >
      <polygon points={starburstPoints(half, half, half - 2, half * 0.78, spokes)} fill={fill} />
    </svg>
  );
}

/** White check inside a solid square — the trade-account benefit marker. */
export function TickSquare({ size = 34, background, color = "#ffffff" }: { size?: number; background: string; color?: string }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{ width: size, height: size, background, borderRadius: 6 }}
      aria-hidden
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5 9.5 18 20 6.5" />
      </svg>
    </span>
  );
}

/** A hard arrow used on CTA plates. */
export function Arrow({ color = "#ffffff", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** A stopwatch dial for click & collect — face, ticks, hand. */
export function Stopwatch({ size = 320, face = "#ffffff", ink = INK, accent }: { size?: number; face?: string; ink?: string; accent: string }) {
  const c = size / 2;
  const ticks = Array.from({ length: 12 });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* crown + button */}
      <rect x={c - 16} y={2} width={32} height={22} rx={6} fill={ink} />
      <rect x={c + 34} y={12} width={42} height={14} rx={7} fill={ink} transform={`rotate(28 ${c + 34} ${19})`} />
      <circle cx={c} cy={c + 4} r={c - 10} fill={face} stroke={ink} strokeWidth={10} />
      <circle cx={c} cy={c + 4} r={c - 42} fill="none" stroke={`${ink}22`} strokeWidth={2} />
      {ticks.map((_, i) => {
        const angle = (Math.PI * 2 * i) / 12;
        const outer = c - 22;
        const inner = i % 3 === 0 ? c - 58 : c - 40;
        return (
          <line
            key={i}
            x1={c + Math.cos(angle) * inner}
            y1={c + 4 + Math.sin(angle) * inner}
            x2={c + Math.cos(angle) * outer}
            y2={c + 4 + Math.sin(angle) * outer}
            stroke={ink}
            strokeWidth={i % 3 === 0 ? 8 : 3}
            strokeLinecap="round"
          />
        );
      })}
      {/* hand pointing at the top (a minute) */}
      <line x1={c} y1={c + 4} x2={c} y2={c - 96} stroke={accent} strokeWidth={12} strokeLinecap="round" />
      <circle cx={c} cy={c + 4} r={14} fill={accent} stroke={ink} strokeWidth={5} />
    </svg>
  );
}

/** Solid plate with a small bevel shadow, used for CTAs. */
export function Plate({
  children,
  background,
  color,
  style,
  className = "",
}: {
  children: ReactNode;
  background: string;
  color: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 font-black uppercase ${className}`.trim()}
      style={{
        background,
        color,
        padding: "14px 24px",
        borderRadius: 8,
        letterSpacing: "0.06em",
        boxShadow: `0 5px 0 rgba(0,0,0,0.35)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
