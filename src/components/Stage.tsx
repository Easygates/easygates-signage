"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Lays its children out on a fixed 1920×1080 canvas and scales that canvas to fit
 * (letterboxed) inside its own box — so a 520px admin preview, a 1080p TV and a 4K TV
 * all show exactly the same composition.
 */
export default function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H));
    fit();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={`overflow-hidden ${className}`}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
