import type { TemplateProps } from "../parts";

/** Template "deals-grid" — one slide on the 1920×1080 canvas. */
export default function DealsGridTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col px-[5%] py-[3%]">
      <div className="sg-anim sg-fade-down mb-3 text-[20px] font-bold tracking-[0.3em] uppercase" style={{ ...d.style(0), color: scene.accentColor }}>
        {scene.eyebrow}
      </div>
      <div className="sg-mask mb-2">
        <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[64px] font-extrabold">{scene.headline}</span>
      </div>
      {scene.subheadline && (
        <div className="sg-anim sg-fade mt-1 text-[22px] opacity-80" style={d.style(2)}>
          {scene.subheadline}
        </div>
      )}
      <div className="sg-anim mt-4 grid grid-cols-3 gap-4" style={d.style(3)}>
        {(scene.items || []).slice(0, 6).map((it, i) => (
          <div key={i} className="overflow-hidden rounded-[20px] bg-white ring-1 ring-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            {it.image && (
              <div className="h-[200px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" draggable={false} />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[26px] font-extrabold">{it.name}</span>
                {it.tag && (
                  <span className="rounded-md px-2 py-0.5 text-[16px] font-black text-white shadow-lg" style={{ background: scene.accentColor }}>
                    {it.tag}
                  </span>
                )}
              </div>
              {it.price && (
                <div className="flex items-baseline gap-1">
                  <span className="text-[30px] font-black" style={{ color: scene.accentColor }}>{it.price}</span>
                </div>
              )}
              {it.desc && <div className="text-[20px] opacity-60">{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
      {scene.ctaText && (
        <div className="sg-anim sg-fade-up mt-5 text-center" style={d.style(9)}>
          <span className="inline-block rounded-full px-8 py-3 font-black tracking-widest text-black" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
