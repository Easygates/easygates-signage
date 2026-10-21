import type { TemplateProps } from "../parts";
import { PriceBlock, kbClass } from "../parts";

/** Template "price-drop" — one slide on the 1920×1080 canvas. */
export default function PriceDropTemplate({ scene, d }: TemplateProps) {
  return (
    <div className="relative z-10 mx-auto flex h-full flex-col items-center justify-center px-[6%] py-[4%]">
      <div className="sg-anim sg-scale-in mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[20px] font-black text-white shadow-xl" style={{ ...d.style(0), background: scene.accentColor }}>
        <span className="text-[24px]">▼</span>
        <span>PRICE DROP</span>
      </div>
      <div className="sg-mask mt-2">
        <span style={{ animationDelay: `${150 + d.s}ms`, color: scene.textColor }} className="sg-display text-[110px] font-black">
          {scene.productName || scene.headline}
        </span>
      </div>
      <PriceBlock scene={scene} d={d} />
      {scene.description && (
        <p className="sg-anim sg-fade-up mt-4 max-w-xl text-[28px] leading-relaxed" style={{ ...d.style(5), color: scene.mutedColor }}>
          {scene.description}
        </p>
      )}
      {scene.imageUrl && (
        <div className="sg-anim sg-scale-in mt-6 w-full max-w-[560px] overflow-hidden rounded-[32px] ring-4 ring-white ring-offset-4 ring-offset-[#ffffff]" style={d.style(6)}>
          <div className="relative overflow-hidden rounded-[28px] bg-white ${kbClass(scene.kenBurns)}">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene.imageUrl} alt={scene.productName || "product"} className="h-full w-full object-cover" style={{ objectPosition: scene.imagePosition || "center" }} draggable={false} />
          </div>
        </div>
      )}
      {scene.ctaText && (
        <div className="sg-anim sg-pop mt-6" style={d.style(7)}>
          <span className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[22px] font-black tracking-wide text-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]" style={{ background: scene.accentColor }}>
            {scene.ctaText}
          </span>
        </div>
      )}
    </div>
  );
}
