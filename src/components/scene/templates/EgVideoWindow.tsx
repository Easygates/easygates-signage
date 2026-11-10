import type { TemplateProps } from "../parts";
import { A, AREA_H, BOTTOM, CtaBar, Head, MARGIN, TOP, countLines, headHeight } from "./brandParts";
import { alpha, kit } from "./brandKit";
import { shapeRatio, windowShape, windowSize } from "./videoKit";
import { CornerBrackets, VideoOrPlaceholder } from "./videoParts";

/**
 * Template "eg-video-window" — EasyGates Direct · Video in a centred window.
 *
 * The video plays in a framed window in the middle of the screen, cropped (never stretched) to the
 * window's shape, under an EasyGates Direct headline. Four shapes: wide 16:9, a cinema strip 21:9, square
 * and portrait. An optional label sits on the corner of the video; the button sits beside the headline and
 * a line of text runs underneath, so the window gets as much of the screen as possible.
 *
 * FIELDS:
 * - videoUrl    = the video: pick it from the videos folder on the server, or paste an address (.mp4 / .webm)
 * - eyebrow     = small label above the headline, e.g. "EASYGATES DIRECT · PRODUCT DEMO"
 * - headline    = the title above the window, e.g. "SEE IT RUNNING"
 * - subheadline = one line under the headline
 * - productName = a label over the corner of the video, e.g. "EASYGLIDE 600 · LIVE TEST"
 * - description = one line of text under the window
 * - ctaText     = optional button beside the headline, e.g. "ASK FOR A TRADE PRICE"
 * - layoutVariant = the window shape: "wide", "cinema", "square" or "portrait" (the editor has a menu for it)
 * - imagePosition = which part of the picture to keep when it is cropped (the focal point)
 * - highlightColor = the second accent (the corner label)
 * Not used: imageUrl, prices, items.
 * Set the slide's Duration to the clip's length; the video restarts each time the slide comes round.
 */

export default function EgVideoWindowTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const shape = windowShape(scene.layoutVariant);
  const totalW = 1920 - MARGIN * 2;
  const label = (scene.productName || "").trim();
  const line = (scene.description || "").trim();
  const hasCta = Boolean((scene.ctaText || "").trim());

  // The button sits up beside the headline (there is empty room there), which leaves the window the
  // whole height between the header and the one-line caption underneath it.
  const headW = hasCta ? totalW - 680 : totalW;
  const head = headHeight(scene, headW, 72, 40);
  const lineH = line ? countLines(line, 30, totalW, { ls: 0 }) * 38 : 0;
  const gaps = (head || hasCta ? 24 : 0) + (lineH ? 24 : 0);
  const topH = Math.max(head, hasCta ? 90 : 0);
  const room = AREA_H - topH - lineH - gaps - 2 * 24; // 24px each side for the corner brackets
  const win = windowSize(shapeRatio(shape), totalW - 2 * 24, room);
  const labelPx = win.w < 700 ? 22 : 28;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 24 }}>
      {head || hasCta ? (
        <div style={{ flex: "none", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div style={{ minWidth: 0, flex: 1 }}>{head ? <Head scene={scene} d={d} k={k} width={headW} max={72} min={40} /> : null}</div>
          <CtaBar scene={scene} d={d} k={k} i={5} width={640} />
        </div>
      ) : null}

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <A d={d} i={2} cls="sg-scale-in" slow style={{ position: "relative", width: win.w, height: win.h, flex: "none" }}>
          {/* soft accent glow behind the frame */}
          <div aria-hidden="true" style={{ position: "absolute", left: -40, top: -40, right: -40, bottom: -40, borderRadius: 60, background: `radial-gradient(closest-side, ${alpha(k.accent, k.dark ? 0.3 : 0.2)}, transparent)`, filter: "blur(18px)" }} />
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: 26,
              background: "#000",
              border: `3px solid ${alpha(k.text, 0.28)}`,
              boxSizing: "border-box",
              boxShadow: k.dark ? "0 30px 80px rgba(0,0,0,0.55)" : "0 24px 60px rgba(15,23,42,0.25)",
            }}
          >
            <VideoOrPlaceholder src={(scene.videoUrl || "").trim()} position={scene.imagePosition || "center"} k={k} compact={win.h < 520} />
            {label ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 28,
                  maxWidth: "88%",
                  padding: "12px 26px 12px 22px",
                  borderRadius: "0 14px 14px 0",
                  background: k.solid2,
                  color: k.solid2Ink,
                  fontSize: labelPx,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  boxShadow: "0 8px 0 rgba(0,0,0,0.25)",
                }}
              >
                {label}
              </span>
            ) : null}
          </div>
          <CornerBrackets color={k.accent} inset={20} />
        </A>
      </div>

      {line ? (
        <A d={d} i={3} cls="sg-fade-up" tag="p" style={{ flex: "none", margin: 0, textAlign: "center", fontSize: 30, fontWeight: 700, lineHeight: "38px", color: k.muted }}>
          {line}
        </A>
      ) : null}
    </div>
  );
}
