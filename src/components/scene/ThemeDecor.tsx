import type { Scene } from "@/lib/signage";

/** ── Seasonal theme decorations ────────────────────────────────────────── */
// Theme palette: accent, gradient, text. Decorations always draw; colours
// only override the slide when applyColors is on (handled in brandScene).
export const THEME_PALETTES: Record<string, { accent: string; bgFrom: string; bgTo: string; text: string; muted: string }> = {
  christmas: { accent: "#dc2626", bgFrom: "#ffffff", bgTo: "#fef2f2", text: "#7f1d1d", muted: "#991b1b" },
  easter:    { accent: "#ec4899", bgFrom: "#ffffff", bgTo: "#fce7f3", text: "#881337", muted: "#be185d" },
  halloween: { accent: "#f97316", bgFrom: "#fef2f2", bgTo: "#fecaca", text: "#7c2d12", muted: "#c2410c" },
  spring:    { accent: "#16a34a", bgFrom: "#f0fdf4", bgTo: "#dcfce7", text: "#14532d", muted: "#15803d" },
  summer:    { accent: "#0ea5e9", bgFrom: "#ffffff", bgTo: "#dbeafe", text: "#0c4a6e", muted: "#0369a1" },
  autumn:    { accent: "#d97706", bgFrom: "#fffbeb", bgTo: "#fef3c7", text: "#78350f", muted: "#a16207" },
  winter:    { accent: "#0ea5e9", bgFrom: "#ffffff", bgTo: "#eff6ff", text: "#0c4a6e", muted: "#0369a1" },
  none:      { accent: "#ff3b30", bgFrom: "#0b1020", bgTo: "#1e2a5a", text: "#ffffff", muted: "#c7cede" },
};

export function themePalette(theme: string | undefined) {
  return THEME_PALETTES[theme ?? "none"] ?? THEME_PALETTES.none;
}

/** Evenly spread, deterministic falling particles (no randomness, so server and browser agree). */
function particles(
  n: number,
  o: { colors: string[]; size: [number, number]; dur: [number, number]; round?: boolean }
) {
  return Array.from({ length: n }, (_, i) => ({
    left: Math.round(((i + 0.5) / n) * 1860 + ((i * 47) % 61) - 30),
    size: Math.round(o.size[0] + ((i * 7) % 5) * ((o.size[1] - o.size[0]) / 4)),
    color: o.colors[i % o.colors.length],
    dur: Math.round(o.dur[0] + ((i * 5) % 6) * ((o.dur[1] - o.dur[0]) / 5)),
    delay: -((i * 1.7) % 9), // negative = already mid-fall when the slide appears
    opacity: 0.55 + (i % 3) * 0.15,
    round: Boolean(o.round),
  }));
}

/** Particles are plain positioned elements (SVG <use> ignores CSS left/top). The sg-snow class falls
 *  them down the canvas and is switched off by the .sg-reduced rule in globals.css. */
function Falling({ items }: { items: ReturnType<typeof particles> }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {items.map((p, i) => (
        <span
          key={i}
          className="sg-snow absolute block"
          style={{
            left: p.left,
            top: -40,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? "50%" : "70% 0 70% 0",
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** SVG decorations drawn behind/around content, never over prices or text.
 *  Respects .sg-reduced (stops all animation). */
export function ThemeDecor({ scene, theme }: { scene: Scene; theme: string }) {
  const p = themePalette(theme);
  const reduced = "sg-reduced";
  // We can't read the reduced class here; the parent passes it via className on the
  // root. Instead decorations use inline `style` with animation-play-state that the
  // .sg-reduced CSS overrides in SceneRenderer's root style.
  return (
    <>
      {theme === "christmas" && (
        <>
          {/* falling snowflakes */}
          <Falling items={particles(12, { colors: ["#ffffff"], size: [8, 18], round: true, dur: [7, 13] })} />
          {/* bunting along the top */}
          <svg className="absolute top-0 left-0 right-0 h-[28px] z-10 pointer-events-none" width="1920" height="28">
            <defs>
              <polygon id="bunt" points="0,28 14,0 28,28" fill="#dc2626" />
            </defs>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => (
              <use key={i} href="#bunt" x={i * 96} fill={i % 2 === 0 ? "#dc2626" : "#ffffff"} />
            ))}
          </svg>
        </>
      )}
      {theme === "easter" && (
        <>
          {/* pastel eggs dotted around bottom */}
          <svg className="absolute bottom-0 left-0 right-0 h-[60px] z-0 pointer-events-none" width="1920" height="60" style={{ overflow: "hidden" }}>
            <defs>
              <ellipse id="egg" rx="14" ry="20" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
            </defs>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <use
                key={i}
                className="sg-bob"
                href="#egg"
                x={60 + i * 130}
                y={10}
                fill={["#fce7f3", "#e0f2fe", "#dcfce7", "#fef3c7"][i % 4]}
                stroke={["#ec4899", "#0ea5e9", "#16a34a", "#d97706"][i % 4]}
                style={{ animation: `sg-bob ${3 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
              />
            ))}
          </svg>
          {/* small flowers */}
          <svg className="absolute top-0 left-0 w-[200px] h-[200px] z-0 pointer-events-none">
            <circle cx="40" cy="40" r="6" fill="#fbbf24" />
            <circle cx="40" cy="40" r="4" fill="#ffffff" opacity="0.6" />
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <circle key={i} cx={40 + 16 * Math.cos(a)} cy={40 + 16 * Math.sin(a)} r="8" fill="#f472b6" />
              );
            })}
          </svg>
        </>
      )}
      {theme === "halloween" && (
        <>
          {/* pumpkins along the bottom */}
          <svg className="absolute bottom-0 left-0 right-0 h-[56px] z-0 pointer-events-none" width="1920" height="56" style={{ overflow: "hidden" }}>
            <defs>
              <g id="pumpkin">
                <circle cx="14" cy="14" r="14" fill="#f97316" />
                <rect x="11" y="2" width="6" height="10" fill="#65a30d" />
              </g>
            </defs>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <use
                key={i}
                className="sg-bob"
                href="#pumpkin"
                x={40 + i * 190}
                y={28}
                style={{ animation: `sg-bob ${2.5 + (i % 2)}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </svg>
          {/* bats top-right */}
          <svg className="absolute top-0 right-0 w-[160px] h-[120px] z-0 pointer-events-none">
            <path d="M40,60 Q20,40 40,20 T80,60" fill="none" stroke="#4d4d4d" strokeWidth="4" />
            <path d="M80,60 Q100,40 80,20 T120,60" fill="none" stroke="#4d4d4d" strokeWidth="4" />
            <path d="M0,80 Q20,60 40,80 T80,60" fill="none" stroke="#4d4d4d" strokeWidth="4" />
          </svg>
        </>
      )}
      {theme === "spring" && (
        <>
          {/* blossom petals falling */}
          <Falling items={particles(10, { colors: ["#f9a8d4", "#f472b6", "#fbcfe8"], size: [16, 26], dur: [8, 15] })} />
          {/* branch bottom-left */}
          <svg className="absolute bottom-0 left-0 w-[220px] h-[140px] z-0 pointer-events-none">
            <path d="M20,120 Q100,100 200,40" fill="none" stroke="#a16207" strokeWidth="6" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const x = 40 + i * 30;
              return (
                <path key={i} d={`M${x},100 Q${x + 15},60 ${x + 30},100`} fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
              );
            })}
          </svg>
        </>
      )}
      {theme === "summer" && (
        <>
          {/* sun top-right */}
          <svg className="absolute top-0 right-0 w-[120px] h-[120px] z-0 pointer-events-none">
            <circle cx="60" cy="60" r="26" fill="#fbbf24" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={60 + 30 * Math.cos(a)}
                  y1={60 + 30 * Math.sin(a)}
                  x2={60 + 42 * Math.cos(a)}
                  y2={60 + 42 * Math.sin(a)}
                  stroke="#fbbf24"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          {/* waves bottom */}
          <svg className="absolute bottom-0 left-0 right-0 h-[40px] z-0 pointer-events-none" width="1920" height="40">
            <path d="M0,40 Q160,0 320,40 T640,40 T960,40 T1280,40 T1600,40 T1920,40" fill="none" stroke="#0ea5e9" strokeWidth="6" />
            <path d="M0,36 Q160,4 320,36 T640,36 T960,36 T1280,36 T1600,36 T1920,36" fill="none" stroke="#22d3ee" strokeWidth="4" opacity="0.7" />
          </svg>
        </>
      )}
      {theme === "autumn" && (
        <>
          {/* falling leaves */}
          <Falling items={particles(10, { colors: ["#d97706", "#b45309", "#dc2626", "#eab308"], size: [20, 32], dur: [9, 16] })} />
          {/* acorn bottom-left */}
          <svg className="absolute bottom-0 left-0 w-[80px] h-[100px] z-0 pointer-events-none">
            <rect x="34" y="60" width="12" height="40" fill="#78350f" />
            <ellipse cx="40" cy="50" rx="26" ry="22" fill="#b45309" />
          </svg>
        </>
      )}
      {theme === "winter" && (
        <>
          {/* frost corners */}
          <svg className="absolute inset-0 z-0 pointer-events-none" width="1920" height="1080">
            <defs>
              <pattern id="frost" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#ffffff" opacity="0.3" />
                <circle cx="2" cy="2" r="0.5" fill="#ffffff" opacity="0.2" />
                <circle cx="18" cy="18" r="0.5" fill="#ffffff" opacity="0.2" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="320" height="1080" fill="url(#frost)" />
            <rect x="1600" y="0" width="320" height="1080" fill="url(#frost)" />
          </svg>
          {/* soft snow top */}
          <svg className="absolute top-0 left-0 right-0 h-[40px] z-0 pointer-events-none" width="1920" height="40">
            <rect width="1920" height="40" fill="#ffffff" opacity="0.15" />
          </svg>
        </>
      )}
      {theme === "none" && null}
    </>
  );
}
