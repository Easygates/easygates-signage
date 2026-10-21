import type { TemplateProps } from "../parts";

/** Template "top-sellers" — one slide on the 1920×1080 canvas. */
export default function TopSellersTemplate({ scene, d }: TemplateProps) {
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
      <div className="sg-anim mt-6 flex flex-col gap-4 w-full max-w-[900px]" style={d.style(3)}>
        {(scene.items || []).slice(0, 5).map((it, i) => {
          const rank = i + 1;
          return (
            <div key={i} className="flex items-center gap-5 rounded-[20px] bg-white ring-1 ring-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[32px] font-black ${i === 0 ? "text-yellow-600" : "text-white"}`} style={{ background: i === 0 ? scene.accentColor : "#f1f5f9" }}>
                #{rank}
              </div>
              {it.image && (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" draggable={false} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-[26px] font-extrabold">{it.name}</div>
                {it.price && <div className="text-[30px] font-black" style={{ color: scene.accentColor }}>{it.price}</div>}
              </div>
              {it.tag && (
                <span className="shrink-0 rounded-full px-3 py-1 text-[18px] font-black text-white shadow-lg" style={{ background: scene.accentColor }}>
                  {it.tag}
                </span>
              )}
            </div>
          );
        })}
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
