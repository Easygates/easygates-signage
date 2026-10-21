import type { TemplateProps } from "../parts";

/** Template "multibuy" — one slide on the 1920×1080 canvas. */
export default function MultibuyTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col items-center justify-center px-[6%] py-[4%]">
      <div className="sg-anim sg-scale-in mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[20px] font-black text-white shadow-xl" style={{ ...d.style(0), background: scene.accentColor }}>
        <span className="text-[24px]">🛒</span>
        <span>{scene.headline}</span>
      </div>
      {scene.subheadline && (
        <div className="sg-anim sg-fade text-[22px] opacity-80" style={d.style(1)}>
          {scene.subheadline}
        </div>
      )}
      <div className="sg-anim sg-scale-in mt-6 grid grid-cols-3 gap-6 w-full max-w-[900px]" style={d.style(2)}>
        {(scene.items || []).slice(0, 3).map((it, i) => (
          <div key={i} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            {it.image && (
              <div className="h-[260px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" draggable={false} />
              </div>
            )}
            <div className="p-3">
              <div className="text-[26px] font-extrabold">{it.name}</div>
              {it.price && <div className="text-[34px] font-black" style={{ color: scene.accentColor }}>{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
      {scene.ctaText && (
        <div className="sg-anim sg-pop mt-6" style={d.style(6)}>
          <span className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[24px] font-black tracking-wide text-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
