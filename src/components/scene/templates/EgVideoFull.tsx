import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, Head, MARGIN } from "./brandParts";
import { kit } from "./brandKit";
import { scrimStrength } from "./videoKit";
import { VideoOrPlaceholder } from "./videoParts";

/**
 * Template "eg-video-full" — EasyGates Direct · Full-screen video.
 *
 * A video that fills the whole screen (edge to edge, cropped — never stretched — to cover it), muted and
 * looping, with an optional EasyGates Direct caption laid over a dark lower third: a small label, a big
 * headline, a line of text and a button. Leave the text fields empty for the video on its own; the logo,
 * clock and ticker from Business settings still sit on top, as they do on every slide.
 *
 * FIELDS:
 * - videoUrl    = the video: pick it from the videos folder on the server, or paste an address (.mp4 / .webm)
 * - eyebrow     = small label above the headline, e.g. "EASYGATES DIRECT · GATE AUTOMATION"
 * - headline    = the caption headline, e.g. "FROM BOX TO WORKING GATE"
 * - subheadline = one line under the headline
 * - ctaText     = optional button, e.g. "ASK AT THE TRADE COUNTER"
 * - imageFit    = "cover" fills the screen and crops (default); "contain" shows the whole video with bars
 * - imagePosition = which part of the picture to keep when it is cropped (the focal point)
 * - overlayOpacity = how dark the caption's lower third is
 * Not used: imageUrl, prices, productName, description, items, highlightColor.
 * Set the slide's Duration to the clip's length; the video restarts each time the slide comes round.
 */

export default function EgVideoFullTemplate({ scene, d }: TemplateProps) {
  const base = kit(scene);
  // text laid over moving video must always be light on the dark scrim, whatever the slide's palette
  const k = { ...base, text: "#ffffff", muted: "#dbe4ef" };
  const hasCaption = Boolean((scene.headline || "").trim() || (scene.eyebrow || "").trim() || (scene.subheadline || "").trim() || (scene.ctaText || "").trim());
  const strength = scrimStrength(scene.overlayOpacity);
  const width = 1500;

  return (
    <div className="absolute inset-0 z-10" style={{ background: "#000" }}>
      <VideoOrPlaceholder src={(scene.videoUrl || "").trim()} fit={scene.imageFit === "contain" ? "contain" : "cover"} position={scene.imagePosition || "center"} k={base} top={hasCaption} />

      {hasCaption ? (
        <>
          {/* dark lower third so the caption reads over any footage */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 640, pointerEvents: "none", background: `linear-gradient(to top, rgba(4,10,18,${strength}) 0%, rgba(4,10,18,${(strength * 0.72).toFixed(2)}) 38%, rgba(4,10,18,0) 100%)` }}
          />
          <div style={{ position: "absolute", left: MARGIN + 8, bottom: BOTTOM + 40, width, display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ display: "flex", gap: 30, alignItems: "stretch" }}>
              <A d={d} i={0} cls="sg-scale-in" style={{ flex: "none", width: 10, borderRadius: 6, background: base.accent }}>
                <span style={{ display: "block", width: 10, height: "100%" }} />
              </A>
              <div style={{ minWidth: 0, flex: 1, textShadow: "0 3px 24px rgba(0,0,0,0.55)" }}>
                <Head scene={scene} d={d} k={k} width={width - 40} max={92} min={44} />
              </div>
            </div>
            <CtaBar scene={scene} d={d} k={k} i={5} width={width} />
          </div>
        </>
      ) : null}
    </div>
  );
}
