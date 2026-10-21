import type { TemplateProps } from "../parts";

/** Template "clearance" — one slide on the 1920×1080 canvas. */
export default function ClearanceTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col items-center justify-center px-[6%] py-[4%]">
      <div className="sg-anim sg-scale-in mb-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[22px] font-black text-black shadow-[0_20px_60px_rgba(0,0,0,0.4)]" style={{ ...d.style(0), background: "#fef08a", border: `4px solid ${scene.accentColor}` }}>
        <span className="text-[26px]">⚠</span>
        <span>{scene.headline}</span>
      </div>
      {scene.subheadline && (
        <div className="sg-anim sg-fade mt-1 text-[22px] opacity-80" style={d.style(1)}>
          {scene.subheadline}
        </div>
      )}
      <div className="sg-anim mt-6 grid grid-cols-2 gap-6 w-full max-w-[1100px]" style={d.style(2)}>
        {(scene.items || []).slice(0, 4).map((it, i) => (
          <div key={i} className="relative overflow-hidden rounded-[20px] bg-white ring-1 ring-white/20">
            {it.image && (
              <div className="h-[240px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" draggable={false} />
              </div>
            )}
            <div className="absolute -right-2 -top-2">
              <span className="sg-anim sg-pop inline-flex items-center rounded-br-lg rounded-tl-lg px-3 py-1.5 text-[20px] font-black text-white shadow-lg rotate-[15deg]" style={{ ...d.style(3 + i), background: scene.accentColor }}>
                {it.tag}
              </span>
            </div>
            <div className="p-3">
              <div className="text-[26px] font-extrabold">{it.name}</div>
              {it.desc && <div className="text-[20px] opacity-70">{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
      {scene.ctaText && (
        <div className="sg-anim sg-fade-up mt-6 text-center" style={d.style(8)}>
          <span className="inline-block rounded-full px-8 py-3 font-black tracking-widest text-black" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
