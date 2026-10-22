"use client";

// ─── Seasonal theme decorations ─────────────────────────────────────────────
//
// Art direction, not emoji: each theme gets layered decoration at the canvas
// edges (never over prices or headlines), two-tone colour, depth (near/far
// particles) and slow motion. All motion is transform/opacity only, ~40 nodes
// per theme, and every animation stops under `.sg-reduced`.
//
// Palettes live in src/lib/themes.ts (single source of truth, also used by the
// admin picker and the tests).
import { useId } from "react";
import type { Scene } from "@/lib/signage";
import { themeDef, themePalette, type ThemePalette } from "@/lib/themes";

/** Deterministic pseudo-random 0..1 from an index (server and browser agree). */
function rnd(i: number, salt = 1): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Falling layer: far / mid / near tiers so the motion has depth. */
function Falling({
  count,
  colors,
  shape = "circle",
  seed = 1,
  maxSize = 18,
  speed = 1,
  blurNear = true,
}: {
  count: number;
  colors: string[];
  shape?: "circle" | "petal" | "leaf" | "flake";
  seed?: number;
  maxSize?: number;
  speed?: number;
  blurNear?: boolean;
}) {
  return (
    <div className="sg-theme-falling pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const tier = i % 3; // 0 = far, 1 = mid, 2 = near
        const size = Math.round(maxSize * (0.35 + tier * 0.42) * (0.75 + rnd(i, seed) * 0.5));
        const duration = (14 - tier * 3.2) / speed + rnd(i, seed + 7) * 3;
        const colour = colors[i % colors.length];
        const left = Math.round(rnd(i, seed + 2) * 1960 - 20);
        return (
          <span
            key={i}
            className="sg-fall absolute block"
            style={{
              left,
              top: -60,
              animationDuration: `${duration}s`,
              animationDelay: `-${(rnd(i, seed + 3) * duration).toFixed(1)}s`,
              opacity: tier === 0 ? 0.45 : tier === 1 ? 0.7 : 0.9,
              filter: tier === 2 && blurNear ? "blur(0.4px)" : undefined,
            }}
          >
            <span
              className="sg-sway block"
              style={{
                width: size,
                height: shape === "petal" || shape === "leaf" ? size * 0.72 : size,
                background: shape === "flake" ? undefined : colour,
                borderRadius:
                  shape === "circle" ? "50%" : shape === "petal" ? "100% 0 100% 0" : shape === "leaf" ? "0 100% 0 100%" : undefined,
                animationDuration: `${5 + tier * 1.5 + rnd(i, seed + 5) * 3}s`,
                animationDelay: `-${(rnd(i, seed + 6) * 6).toFixed(1)}s`,
              }}
            >
              {shape === "flake" && (
                <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
                  {[0, 60, 120].map((a) => (
                    <line key={a} x1="10" y1="1" x2="10" y2="19" stroke={colour} strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${a} 10 10)`} />
                  ))}
                </svg>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Edge darkening / lightening so the slide feels lit rather than flat. */
function Vignette({ edge, strength = 0.55 }: { edge: string; strength?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ background: `radial-gradient(120% 95% at 50% 38%, transparent 42%, ${edge} 100%)`, opacity: strength }}
    />
  );
}

/** Soft directional light. */
function Glow({ x, y, size, color, opacity = 0.35 }: { x: number; y: number; size: number; color: string; opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute z-0 rounded-full sg-glow-pulse"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        opacity,
      }}
    />
  );
}

/** Six-petal blossom used by spring / easter. */
function Blossom({ cx, cy, r, petal, heart }: { cx: number; cy: number; r: number; petal: string; heart: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={cx + Math.sin((a * Math.PI) / 180) * r} cy={cy + Math.cos((a * Math.PI) / 180) * r} r={r * 0.82} fill={petal} opacity="0.92" />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.5} fill={heart} />
    </g>
  );
}

/** A branch with blossoms — spring / easter corners. */
function BlossomBranch({ id, flip = false }: { id: string; flip?: boolean }) {
  return (
    <svg
      className="pointer-events-none absolute z-0"
      style={flip ? { right: 0, bottom: 0, transform: "scaleX(-1)" } : { left: 0, top: 0 }}
      width="520"
      height="380"
      viewBox="0 0 520 380"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-bark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5e3c" />
          <stop offset="100%" stopColor="#5f3d26" />
        </linearGradient>
      </defs>
      <path d="M-30 30 C 120 -6, 250 40, 400 150" fill="none" stroke={`url(#${id}-bark)`} strokeWidth="11" strokeLinecap="round" opacity="0.9" />
      <path d="M120 18 C 150 70, 168 120, 150 190" fill="none" stroke={`url(#${id}-bark)`} strokeWidth="6" strokeLinecap="round" opacity="0.85" />
      <path d="M250 62 C 280 110, 292 150, 276 214" fill="none" stroke={`url(#${id}-bark)`} strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      <Blossom cx={122} cy={22} r={15} petal="#fbcfe8" heart="#f59e0b" />
      <Blossom cx={168} cy={78} r={12} petal="#f9a8d4" heart="#fbbf24" />
      <Blossom cx={150} cy={190} r={14} petal="#fbcfe8" heart="#f59e0b" />
      <Blossom cx={252} cy={66} r={13} petal="#f9a8d4" heart="#fbbf24" />
      <Blossom cx={276} cy={212} r={11} petal="#fbcfe8" heart="#f59e0b" />
      <Blossom cx={340} cy={112} r={16} petal="#fdf2f8" heart="#f59e0b" />
      <Blossom cx={398} cy={150} r={12} petal="#f9a8d4" heart="#fbbf24" />
    </svg>
  );
}

export function ThemeDecor({ theme }: { theme: string; scene?: Scene }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const def = themeDef(theme);
  const p: ThemePalette = themePalette(theme);
  const light = Boolean(def.light);
  const edge = light ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.55)";

  return (
    <div className="sg-theme pointer-events-none absolute inset-0 z-0" aria-hidden="true" data-theme={def.id}>
      {def.id === "christmas" && (
        <>
          <Glow x={380} y={40} size={900} color="rgba(245,197,66,0.30)" opacity={0.5} />
          <Glow x={1560} y={120} size={760} color="rgba(225,29,72,0.28)" opacity={0.45} />
          {/* string lights */}
          <svg className="absolute left-0 right-0 top-0 z-10" width="1920" height="150" viewBox="0 0 1920 150" aria-hidden="true">
            <path d="M0 14 Q 480 96 960 54 T 1920 30" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5" />
            {Array.from({ length: 15 }, (_, i) => {
              const t = i / 14;
              const x = t * 1920;
              const y = 14 + Math.sin(t * Math.PI) * 62 - Math.sin(t * Math.PI * 2) * 10;
              const colour = i % 2 === 0 ? "#f5c542" : i % 3 === 0 ? "#fda4af" : "#fde68a";
              return (
                <g key={i} className="sg-twinkle" style={{ animationDelay: `${(i % 5) * 0.6}s`, animationDuration: `${3 + (i % 3)}s` }}>
                  <circle cx={x} cy={y + 12} r="22" fill={colour} opacity="0.14" />
                  <circle cx={x} cy={y + 12} r="8" fill={colour} />
                  <circle cx={x} cy={y + 12} r="3.4" fill="#fffbe8" />
                </g>
              );
            })}
          </svg>
          {/* pine sprigs with baubles in the bottom corners */}
          <svg className="absolute bottom-0 left-0 z-0" width="420" height="230" viewBox="0 0 420 230" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${i * 26}, ${i * -14}) rotate(${i * 10 - 8} 0 230)`}>
                <path d="M-40 250 C 90 210, 180 150, 250 40" fill="none" stroke="#14532d" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
                {Array.from({ length: 7 }, (_, k) => {
                  const t = k / 6;
                  const x = 90 * t + 0 * t;
                  const y = 220 - t * 170;
                  return (
                    <ellipse key={k} cx={x + 40 * t} cy={y} rx={30 - k * 2} ry={9} fill="#166534" transform={`rotate(${-34 + k * 6} ${x + 40 * t} ${y})`} opacity={0.9} />
                  );
                })}
              </g>
            ))}
            {[
              { x: 96, y: 150, r: 13, c: "#e11d48" },
              { x: 168, y: 96, r: 11, c: "#f5c542" },
              { x: 58, y: 196, r: 10, c: "#f5c542" },
            ].map((b, i) => (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={b.r + 12} fill={b.c} opacity="0.12" />
                <circle cx={b.x} cy={b.y} r={b.r} fill={b.c} />
                <circle cx={b.x - b.r * 0.32} cy={b.y - b.r * 0.34} r={b.r * 0.28} fill="#ffffff" opacity="0.65" />
              </g>
            ))}
          </svg>
          <svg className="absolute bottom-0 right-0 z-0" width="420" height="230" viewBox="0 0 420 230" style={{ transform: "scaleX(-1)" }} aria-hidden="true">
            <path d="M-40 250 C 90 210, 180 150, 250 40" fill="none" stroke="#14532d" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
            {Array.from({ length: 6 }, (_, k) => {
              const t = k / 5;
              return <ellipse key={k} cx={90 * t + 40 * t} cy={220 - t * 170} rx={28 - k * 2} ry={8} fill="#166534" transform={`rotate(${-30 + k * 7} ${90 * t + 40 * t} ${220 - t * 170})`} opacity={0.85} />;
            })}
            <circle cx="150" cy="150" r="24" fill="#f5c542" opacity="0.12" />
            <circle cx="150" cy="150" r="12" fill="#f5c542" />
          </svg>
          <Falling count={30} colors={["#ffffff", "#e0f2fe", "#f8fafc"]} maxSize={20} seed={3} />
          <Vignette edge={edge} strength={0.5} />
        </>
      )}

      {def.id === "easter" && (
        <>
          <Glow x={1600} y={0} size={1100} color="rgba(251,207,232,0.9)" opacity={0.65} />
          <Glow x={200} y={120} size={700} color="rgba(224,242,254,0.85)" opacity={0.6} />
          <BlossomBranch id={`${uid}-e1`} />
          <BlossomBranch id={`${uid}-e2`} flip />
          {/* painted eggs resting on the bottom edge */}
          <svg className="absolute bottom-0 left-0 right-0 z-0" width="1920" height="150" viewBox="0 0 1920 150" aria-hidden="true">
            <defs>
              {[
                ["#fbcfe8", "#ec4899"],
                ["#bae6fd", "#0ea5e9"],
                ["#bbf7d0", "#16a34a"],
                ["#fde68a", "#d97706"],
                ["#ddd6fe", "#7c3aed"],
              ].map(([a, b], i) => (
                <linearGradient key={i} id={`${uid}-egg${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={a} />
                  <stop offset="100%" stopColor={b} />
                </linearGradient>
              ))}
              <clipPath id={`${uid}-eggclip`}>
                <ellipse cx="0" cy="0" rx="30" ry="40" />
              </clipPath>
            </defs>
            {Array.from({ length: 7 }, (_, i) => {
              const x = 120 + i * 268 + rnd(i, 5) * 40;
              const scale = 0.8 + rnd(i, 6) * 0.5;
              return (
                <g key={i} transform={`translate(${x} 118) scale(${scale})`} className="sg-bob" style={{ animationDelay: `${i * 0.5}s`, animationDuration: `${4 + (i % 3)}s` }}>
                  <ellipse cx="0" cy="44" rx="30" ry="7" fill="rgba(0,0,0,0.12)" />
                  <g clipPath={`url(#${uid}-eggclip)`}>
                    <ellipse cx="0" cy="0" rx="30" ry="40" fill={`url(#${uid}-egg${i % 5})`} />
                    {/* pattern: two bands + dots */}
                    <rect x="-30" y="-14" width="60" height="9" fill="#ffffff" opacity="0.55" transform="rotate(-12)" />
                    <rect x="-30" y="10" width="60" height="6" fill="#ffffff" opacity="0.4" transform="rotate(-12)" />
                    {[-18, 0, 18].map((dx) => (
                      <circle key={dx} cx={dx} cy={-26} r="3" fill="#ffffff" opacity="0.7" />
                    ))}
                  </g>
                  <ellipse cx="-9" cy="-16" rx="7" ry="11" fill="#ffffff" opacity="0.35" transform="rotate(-18)" />
                </g>
              );
            })}
          </svg>
          <Falling count={22} colors={["#f9a8d4", "#fbcfe8", "#fdf2f8", "#fcd34d"]} shape="petal" maxSize={16} seed={11} />
          <Vignette edge="rgba(190,24,93,0.20)" strength={0.45} />
        </>
      )}

      {def.id === "halloween" && (
        <>
          {/* moon with halo and craters */}
          <svg className="absolute right-0 top-0 z-0" width="620" height="480" viewBox="0 0 620 480" aria-hidden="true">
            <defs>
              <radialGradient id={`${uid}-moon`}>
                <stop offset="0%" stopColor="#fff7e6" />
                <stop offset="70%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </radialGradient>
              <radialGradient id={`${uid}-halo`}>
                <stop offset="0%" stopColor="rgba(253,230,138,0.55)" />
                <stop offset="60%" stopColor="rgba(253,230,138,0.12)" />
                <stop offset="100%" stopColor="rgba(253,230,138,0)" />
              </radialGradient>
            </defs>
            <circle cx="470" cy="120" r="210" fill={`url(#${uid}-halo)`} />
            <circle cx="470" cy="120" r="86" fill={`url(#${uid}-moon)`} />
            <circle cx="444" cy="98" r="15" fill="#f59e0b" opacity="0.28" />
            <circle cx="494" cy="132" r="10" fill="#f59e0b" opacity="0.22" />
            <circle cx="466" cy="152" r="7" fill="#f59e0b" opacity="0.2" />
            {/* cobweb top-left */}
            <g stroke="rgba(255,255,255,0.16)" strokeWidth="1.6" fill="none">
              {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 0.5;
                return <line key={i} x1="0" y1="0" x2={Math.cos(a) * 200} y2={Math.sin(a) * 200} />;
              })}
              {[46, 92, 140].map((r) => (
                <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} />
              ))}
            </g>
          </svg>
          {/* bats, three depths */}
          <svg className="absolute left-0 top-0 z-0" width="1920" height="520" viewBox="0 0 1920 520" aria-hidden="true">
            {[
              { x: 260, y: 120, s: 1.5, o: 0.9, d: 26 },
              { x: 700, y: 78, s: 1.0, o: 0.7, d: 34 },
              { x: 1080, y: 190, s: 0.75, o: 0.55, d: 42 },
              { x: 380, y: 260, s: 0.6, o: 0.4, d: 50 },
            ].map((b, i) => (
              <g key={i} className="sg-drift" style={{ animationDuration: `${b.d}s`, animationDelay: `-${i * 4}s`, opacity: b.o }}>
                <g transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
                  <path d="M0 0 C -12 -14, -30 -16, -40 -4 C -30 -8, -20 -4, -14 4 C -10 -2, -4 -2, 0 4 C 4 -2, 10 -2, 14 4 C 20 -4, 30 -8, 40 -4 C 30 -16, 12 -14, 0 0 Z" fill="#1b1024" />
                </g>
              </g>
            ))}
          </svg>
          {/* pumpkins along the bottom */}
          <svg className="absolute bottom-0 left-0 right-0 z-0" width="1920" height="220" viewBox="0 0 1920 220" aria-hidden="true">
            <defs>
              <radialGradient id={`${uid}-punk`}>
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2410c" />
              </radialGradient>
            </defs>
            {[
              { x: 150, s: 1.15 },
              { x: 1720, s: 1.0 },
              { x: 940, s: 0.72 },
            ].map((pk, i) => (
              <g key={i} transform={`translate(${pk.x} 196) scale(${pk.s})`} className="sg-bob" style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${5 + i}s` }}>
                <ellipse cx="0" cy="16" rx="86" ry="12" fill="rgba(0,0,0,0.35)" />
                <ellipse cx="-34" cy="0" rx="40" ry="50" fill={`url(#${uid}-punk)`} />
                <ellipse cx="0" cy="0" rx="44" ry="54" fill={`url(#${uid}-punk)`} />
                <ellipse cx="34" cy="0" rx="40" ry="50" fill={`url(#${uid}-punk)`} />
                <rect x="-8" y="-64" width="16" height="18" rx="4" fill="#4d7c0f" />
                <path d="M-8 -66 C 10 -84, 26 -80, 30 -92" fill="none" stroke="#65a30d" strokeWidth="6" strokeLinecap="round" />
                {/* carved face, lit from inside */}
                <path d="M-26 -14 l 16 -14 l -16 -3 Z" fill="#fde68a" />
                <path d="M26 -14 l -16 -14 l 16 -3 Z" fill="#fde68a" />
                <path d="M-22 12 l 8 -10 l 8 8 l 8 -10 l 8 8 l 8 -10 l 4 14 Z" fill="#fde68a" />
              </g>
            ))}
          </svg>
          <Glow x={260} y={980} size={620} color="rgba(251,146,60,0.30)" opacity={0.55} />
          <Glow x={1620} y={1010} size={520} color="rgba(251,146,60,0.24)" opacity={0.5} />
          <Vignette edge="rgba(10,4,16,0.72)" strength={0.6} />
        </>
      )}

      {def.id === "spring" && (
        <>
          <Glow x={1500} y={40} size={1000} color="rgba(190,242,100,0.55)" opacity={0.5} />
          <Glow x={260} y={620} size={820} color="rgba(134,239,172,0.45)" opacity={0.45} />
          <BlossomBranch id={`${uid}-s1`} />
          <BlossomBranch id={`${uid}-s2`} flip />
          {/* grass along the bottom */}
          <svg className="absolute bottom-0 left-0 right-0 z-0" width="1920" height="130" viewBox="0 0 1920 130" aria-hidden="true">
            {Array.from({ length: 46 }, (_, i) => {
              const x = i * 42 + rnd(i, 4) * 18;
              const h = 46 + rnd(i, 5) * 66;
              const lean = (rnd(i, 6) - 0.5) * 34;
              return (
                <path
                  key={i}
                  d={`M${x} 130 C ${x + lean * 0.4} ${130 - h * 0.5}, ${x + lean} ${130 - h * 0.85}, ${x + lean * 1.5} ${130 - h}`}
                  fill="none"
                  stroke={i % 3 === 0 ? "#16a34a" : i % 3 === 1 ? "#22c55e" : "#4ade80"}
                  strokeWidth={3.4 + (i % 2)}
                  strokeLinecap="round"
                  opacity={0.55}
                  className="sg-sway"
                  style={{ animationDuration: `${4 + (i % 4)}s`, animationDelay: `-${i * 0.17}s` }}
                />
              );
            })}
          </svg>
          {/* butterflies */}
          {[
            { x: 1420, y: 210, d: 22 },
            { x: 640, y: 150, d: 28 },
          ].map((b, i) => (
            <svg key={i} className="sg-drift absolute z-0" style={{ left: b.x, top: b.y, animationDuration: `${b.d}s` }} width="60" height="46" viewBox="0 0 60 46" aria-hidden="true">
              <path d="M30 22 C 8 0, 0 12, 10 24 C 0 34, 12 44, 30 26" fill="#f472b6" opacity="0.85" />
              <path d="M30 22 C 52 0, 60 12, 50 24 C 60 34, 48 44, 30 26" fill="#fb7185" opacity="0.85" />
              <line x1="30" y1="16" x2="30" y2="32" stroke="#7c2d12" strokeWidth="2" />
            </svg>
          ))}
          <Falling count={24} colors={["#f9a8d4", "#fbcfe8", "#fda4af", "#fef3c7"]} shape="petal" maxSize={17} seed={21} />
          <Vignette edge="rgba(20,83,45,0.18)" strength={0.42} />
        </>
      )}

      {def.id === "summer" && (
        <>
          {/* sun with rotating rays */}
          <svg className="absolute right-0 top-0 z-0" width="560" height="480" viewBox="0 0 560 480" aria-hidden="true">
            <defs>
              <radialGradient id={`${uid}-sun`}>
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="55%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </radialGradient>
              <radialGradient id={`${uid}-sunglow`}>
                <stop offset="0%" stopColor="rgba(251,191,36,0.5)" />
                <stop offset="65%" stopColor="rgba(251,191,36,0.1)" />
                <stop offset="100%" stopColor="rgba(251,191,36,0)" />
              </radialGradient>
            </defs>
            <circle cx="430" cy="120" r="220" fill={`url(#${uid}-sunglow)`} />
            <g className="sg-spin-slow" style={{ transformOrigin: "430px 120px", animationDuration: "120s" }}>
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={430 + Math.cos(a) * 96}
                    y1={120 + Math.sin(a) * 96}
                    x2={430 + Math.cos(a) * (132 + (i % 2) * 26)}
                    y2={120 + Math.sin(a) * (132 + (i % 2) * 26)}
                    stroke="#fcd34d"
                    strokeWidth="7"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                );
              })}
            </g>
            <circle cx="430" cy="120" r="84" fill={`url(#${uid}-sun)`} />
          </svg>
          {/* layered sea */}
          <svg className="absolute bottom-0 left-0 right-0 z-0" width="1920" height="260" viewBox="0 0 1920 260" aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-w1`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id={`${uid}-w2`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#075985" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id={`${uid}-w3`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <g className="sg-drift" style={{ animationDuration: "26s" }}>
              <path d="M-200 90 Q 80 40 360 90 T 920 90 T 1480 90 T 2040 90 L 2040 260 L -200 260 Z" fill={`url(#${uid}-w1)`} />
            </g>
            <g className="sg-drift" style={{ animationDuration: "18s", animationDirection: "reverse" }}>
              <path d="M-200 150 Q 120 104 420 150 T 1020 150 T 1620 150 T 2220 150 L 2220 260 L -200 260 Z" fill={`url(#${uid}-w2)`} />
            </g>
            <g className="sg-drift" style={{ animationDuration: "12s" }}>
              <path d="M-200 206 Q 140 168 460 206 T 1100 206 T 1740 206 T 2380 206 L 2380 260 L -200 260 Z" fill={`url(#${uid}-w3)`} />
            </g>
            {/* foam */}
            {Array.from({ length: 14 }, (_, i) => (
              <ellipse key={i} cx={80 + i * 140 + rnd(i, 8) * 60} cy={96 + (i % 3) * 54} rx={26 + rnd(i, 9) * 22} ry="5" fill="#ffffff" opacity="0.35" className="sg-twinkle" style={{ animationDuration: `${5 + (i % 4)}s`, animationDelay: `-${i}s` }} />
            ))}
          </svg>
          {/* gulls */}
          <svg className="absolute left-0 top-0 z-0" width="900" height="360" viewBox="0 0 900 360" aria-hidden="true">
            {[
              { x: 190, y: 120, s: 1 },
              { x: 360, y: 74, s: 0.7 },
              { x: 130, y: 210, s: 0.55 },
            ].map((g, i) => (
              <g key={i} className="sg-drift" style={{ animationDuration: `${30 + i * 8}s`, opacity: 0.7 }}>
                <path d={`M${g.x} ${g.y} q ${16 * g.s} ${-12 * g.s} ${32 * g.s} 0 q ${16 * g.s} ${-12 * g.s} ${32 * g.s} 0`} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={3 * g.s} strokeLinecap="round" />
              </g>
            ))}
          </svg>
          <Vignette edge="rgba(2,20,38,0.55)" strength={0.5} />
        </>
      )}

      {def.id === "autumn" && (
        <>
          <Glow x={300} y={1010} size={1150} color="rgba(245,158,11,0.34)" opacity={0.6} />
          <Glow x={1560} y={80} size={700} color="rgba(180,83,9,0.28)" opacity={0.5} />
          {/* bare tree, bottom-right */}
          <svg className="absolute bottom-0 right-0 z-0" width="720" height="620" viewBox="0 0 720 620" aria-hidden="true">
            <g stroke="#3f1d0b" fill="none" strokeLinecap="round" opacity="0.85">
              <path d="M420 620 C 424 500, 410 420, 396 350" strokeWidth="20" />
              <path d="M396 350 C 360 290, 310 258, 250 236" strokeWidth="12" />
              <path d="M396 350 C 430 288, 486 254, 548 238" strokeWidth="11" />
              <path d="M396 350 C 392 270, 400 210, 420 160" strokeWidth="10" />
              <path d="M250 236 C 224 204, 208 178, 200 148" strokeWidth="6" />
              <path d="M548 238 C 578 210, 598 188, 610 158" strokeWidth="6" />
              <path d="M420 160 C 446 126, 468 108, 496 92" strokeWidth="5" />
              <path d="M420 160 C 398 124, 380 106, 352 88" strokeWidth="5" />
            </g>
            {Array.from({ length: 26 }, (_, i) => {
              const spots = [
                [250, 236], [200, 148], [548, 238], [610, 158], [420, 160], [496, 92], [352, 88], [310, 258], [486, 254], [430, 300],
              ];
              const [x, y] = spots[i % spots.length];
              return (
                <ellipse
                  key={i}
                  cx={x + (rnd(i, 3) - 0.5) * 70}
                  cy={y + (rnd(i, 4) - 0.5) * 60}
                  rx={10 + rnd(i, 5) * 8}
                  ry={7 + rnd(i, 6) * 6}
                  fill={["#f59e0b", "#d97706", "#b45309", "#dc2626"][i % 4]}
                  opacity={0.9}
                  className="sg-sway"
                  style={{ animationDuration: `${4 + (i % 4)}s`, animationDelay: `-${i * 0.2}s` }}
                />
              );
            })}
          </svg>
          {/* mist */}
          <div className="sg-drift absolute -left-24 z-0 h-[220px] w-[2200px] rounded-full bg-white/10 blur-3xl" style={{ top: 700, animationDuration: "40s" }} />
          <div className="sg-drift absolute -left-24 z-0 h-[160px] w-[2200px] rounded-full" style={{ top: 880, background: "rgba(255,236,210,0.10)", filter: "blur(48px)", animationDuration: "56s", animationDirection: "reverse" }} />
          <Falling count={26} colors={["#f59e0b", "#d97706", "#b45309", "#dc2626", "#eab308"]} shape="leaf" maxSize={30} seed={31} speed={0.85} />
          <Vignette edge="rgba(20,8,2,0.62)" strength={0.55} />
        </>
      )}

      {def.id === "winter" && (
        <>
          {/* aurora */}
          <svg className="absolute left-0 top-0 z-0" width="1920" height="520" viewBox="0 0 1920 520" aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-aur1`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(56,189,248,0)" />
                <stop offset="35%" stopColor="rgba(56,189,248,0.55)" />
                <stop offset="70%" stopColor="rgba(165,180,252,0.45)" />
                <stop offset="100%" stopColor="rgba(56,189,248,0)" />
              </linearGradient>
              <linearGradient id={`${uid}-aur2`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(165,180,252,0)" />
                <stop offset="45%" stopColor="rgba(165,180,252,0.45)" />
                <stop offset="100%" stopColor="rgba(103,232,249,0)" />
              </linearGradient>
              <filter id={`${uid}-soft`} x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="26" />
              </filter>
            </defs>
            <g filter={`url(#${uid}-soft)`}>
              <path className="sg-drift" style={{ animationDuration: "34s" }} d="M-100 210 C 300 60, 640 250, 1020 110 C 1320 0, 1660 190, 2020 90 L 2020 300 L -100 300 Z" fill={`url(#${uid}-aur1)`} opacity="0.55" />
              <path className="sg-drift" style={{ animationDuration: "46s", animationDirection: "reverse" }} d="M-100 120 C 260 220, 700 20, 1100 160 C 1480 290, 1700 90, 2020 170 L 2020 330 L -100 330 Z" fill={`url(#${uid}-aur2)`} opacity="0.45" />
            </g>
          </svg>
          {/* frozen corners */}
          <svg className="absolute left-0 top-0 z-0" width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
            <g stroke="rgba(186,230,253,0.35)" strokeWidth="2" fill="none">
              {[0, 60, 120].map((a) => (
                <line key={a} x1="0" y1="0" x2={Math.cos(((a + 45) * Math.PI) / 180) * 260} y2={Math.sin(((a + 45) * Math.PI) / 180) * 260} />
              ))}
              {[70, 130, 200].map((r) => (
                <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} opacity="0.8" />
              ))}
            </g>
          </svg>
          <svg className="absolute bottom-0 right-0 z-0" width="300" height="300" viewBox="0 0 300 300" style={{ transform: "rotate(180deg)" }} aria-hidden="true">
            <g stroke="rgba(186,230,253,0.3)" strokeWidth="2" fill="none">
              {[0, 60, 120].map((a) => (
                <line key={a} x1="0" y1="0" x2={Math.cos(((a + 45) * Math.PI) / 180) * 260} y2={Math.sin(((a + 45) * Math.PI) / 180) * 260} />
              ))}
              {[70, 130, 200].map((r) => (
                <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} opacity="0.8" />
              ))}
            </g>
          </svg>
          {/* snow: flakes plus sparkles */}
          <Falling count={30} colors={["#ffffff", "#e0f2fe"]} maxSize={19} seed={41} />
          <Falling count={10} colors={["#bae6fd", "#ffffff"]} shape="flake" maxSize={13} seed={47} speed={0.7} blurNear={false} />
          <Vignette edge="rgba(2,12,24,0.6)" strength={0.55} />
        </>
      )}
    </div>
  );
}
