import type { TemplateProps } from "../parts";

/** Template "aisle-guide" — one slide on the 1920×1080 canvas. */
export default function AisleGuideTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col items-center justify-center px-[6%] py-[4%]">
      <div className="sg-anim sg-fade-down mb-3 text-[20px] font-bold tracking-[0.3em] uppercase" style={{ ...d.style(0), color: scene.accentColor }}>
        {scene.eyebrow}
      </div>
      <div className="sg-anim sg-scale-in mb-4 relative" style={d.style(1)}>
        <div className="flex h-32 w-32 items-center justify-center rounded-full text-[56px] font-black shadow-[0_24px_60px_rgba(0,0,0,0.35)]" style={{ background: scene.accentColor, color: "#ffffff" }}>
          {scene.productName || scene.headline}
        </div>
      </div>
      <div className="sg-anim sg-fade-up mb-4 text-[28px] font-bold tracking-widest" style={{ ...d.style(2), color: scene.textColor }}>
        {scene.headline}
      </div>
      {scene.subheadline && (
        <p className="sg-anim sg-fade mt-1 max-w-xl text-[22px] leading-relaxed text-center" style={{ ...d.style(3), color: scene.mutedColor }}>
          {scene.subheadline}
        </p>
      )}
      <div className="sg-anim mt-6 flex justify-center gap-4 w-full max-w-[1000px]" style={d.style(4)}>
        {/* arrow */}
        <div className="flex items-center justify-center">
          <svg className="w-[80px] h-[80px]" viewBox="0 0 80 80" fill="none" stroke={scene.accentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            {scene.subheadline?.toLowerCase().includes("left") && (
              <>
                <line x1="60" y1="40" x2="20" y2="40" />
                <polyline points="30,30 20,40 30,50" />
              </>
            )}
            {scene.subheadline?.toLowerCase().includes("right") && (
              <>
                <line x1="20" y1="40" x2="60" y2="40" />
                <polyline points="50,30 60,40 50,50" />
              </>
            )}
            {!scene.subheadline?.toLowerCase().includes("left") && !scene.subheadline?.toLowerCase().includes("right") && (
              <>
                <line x1="40" y1="20" x2="40" y2="60" />
                <polyline points="30,50 40,60 50,50" />
              </>
            )}
          </svg>
        </div>
      </div>
      <div className="sg-anim mt-8 grid grid-cols-2 gap-4 w-full max-w-[900px] text-center" style={d.style(5)}>
        {(scene.items || []).slice(0, 4).map((it, i) => (
          <div key={i} className="rounded-[16px] bg-white/[0.7] px-4 py-3 ring-1 ring-white/20">
            <div className="text-[24px] font-extrabold">{it.name}</div>
            {it.desc && <div className="text-[20px] opacity-70">{it.desc}</div>}
          </div>
        ))}
      </div>
      {scene.ctaText && (
        <div className="sg-anim sg-pop mt-6" style={d.style(7)}>
          <span className="inline-block rounded-full px-8 py-3 font-black tracking-widest text-black" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
