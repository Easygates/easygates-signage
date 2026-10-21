import type { TemplateProps } from "../parts";

/** Template "store-services" — one slide on the 1920×1080 canvas. */
export default function StoreServicesTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col items-center justify-center px-[6%] py-[4%]">
      <div className="sg-anim sg-fade-down mb-3 text-[20px] font-bold tracking-[0.3em] uppercase" style={{ ...d.style(0), color: scene.accentColor }}>
        {scene.eyebrow}
      </div>
      <div className="sg-mask mb-2">
        <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[56px] font-extrabold">{scene.headline}</span>
      </div>
      {scene.subheadline && (
        <div className="sg-anim sg-fade mt-1 text-[22px] opacity-80" style={d.style(2)}>
          {scene.subheadline}
        </div>
      )}
      <div className="sg-anim mt-6 grid grid-cols-2 gap-6 w-full max-w-[1000px]" style={d.style(3)}>
        {(scene.items || []).slice(0, 4).map((it, i) => (
          <div key={i} className="flex items-start gap-4 rounded-[20px] bg-white px-5 py-4 ring-1 ring-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <div className="mt-0.5 shrink-0 text-[30px]" style={{ color: scene.accentColor }}>
              {i === 0 && "📦"}
              {i === 1 && "↩️"}
              {i === 2 && "🕒"}
              {i === 3 && "💬"}
            </div>
            <div className="min-w-0">
              <div className="text-[26px] font-extrabold">{it.name}</div>
              {it.desc && <div className="text-[22px] leading-relaxed opacity-70">{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
      {scene.ctaText && (
        <div className="sg-anim sg-pop mt-6" style={d.style(8)}>
          <span className="inline-block rounded-full px-8 py-3 font-black tracking-widest text-black" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
