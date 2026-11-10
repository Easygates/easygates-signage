// Pure helpers for the two EasyGates Direct video templates (eg-video-full, eg-video-window).
// No React and no imports, so `node --test` can load this file directly.

export type WindowShape = "wide" | "cinema" | "square" | "portrait";

export const WINDOW_SHAPES: { id: WindowShape; name: string; ratio: number }[] = [
  { id: "wide", name: "Wide — 16:9", ratio: 16 / 9 },
  { id: "cinema", name: "Cinema strip — 21:9", ratio: 21 / 9 },
  { id: "square", name: "Square — 1:1", ratio: 1 },
  { id: "portrait", name: "Portrait — 3:4", ratio: 3 / 4 },
];

/** The shape a slide asks for. Anything unknown (including the editor's default "A") means wide. */
export function windowShape(variant: string | undefined | null): WindowShape {
  const v = (variant || "").trim().toLowerCase();
  return WINDOW_SHAPES.some((s) => s.id === v) ? (v as WindowShape) : "wide";
}

export function shapeRatio(shape: WindowShape): number {
  return WINDOW_SHAPES.find((s) => s.id === shape)?.ratio ?? 16 / 9;
}

/**
 * The biggest window of this shape that fits the space, centred by the caller. The video is cropped
 * (never stretched) to fill it, so the shape is what decides which part of the picture is lost.
 */
export function windowSize(ratio: number, availW: number, availH: number): { w: number; h: number } {
  const maxW = Math.max(0, availW);
  const maxH = Math.max(0, availH);
  if (!maxW || !maxH || !(ratio > 0)) return { w: 0, h: 0 };
  let w = Math.min(maxW, maxH * ratio);
  let h = w / ratio;
  // keep whole pixels so the frame edges stay crisp on the TV
  w = Math.floor(w);
  h = Math.floor(h);
  return { w, h };
}

/** A scrim strength for the caption over a full-screen video: the slide's "Darken" setting, kept useful. */
export function scrimStrength(overlayOpacity: number | undefined | null): number {
  const n = typeof overlayOpacity === "number" && Number.isFinite(overlayOpacity) ? overlayOpacity : 45;
  return Math.max(0.35, Math.min(0.92, n / 100 + 0.2));
}
