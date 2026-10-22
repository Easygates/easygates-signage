"use client";

import { useMemo } from "react";
import Stage from "@/components/Stage";
import SceneRenderer from "@/components/SceneRenderer";
import { BrandBar, ProgressBar, Ticker } from "@/components/PlayerChrome";
import { brandScene, tickerFor, type BrandSettings } from "@/lib/brand";
import type { Scene } from "@/lib/signage";

/** One screen exactly as the TV shows it — used by the player and every admin preview. */
export default function ScreenView({
  scene,
  brand,
  animKey,
  reducedMotion,
  className = "absolute inset-0",
  sceneClassName = "",
  progressKey,
  preview = false,
}: {
  scene: Scene;
  brand: BrandSettings;
  animKey: string | number;
  reducedMotion?: boolean;
  className?: string;
  /** scene transition class (enter / exit) */
  sceneClassName?: string;
  /** omit to hide the progress bar */
  progressKey?: string | number;
  preview?: boolean;
}) {
  const shown = useMemo(() => brandScene(scene, brand), [scene, brand]);
  const ticker = tickerFor(scene, brand);
  return (
    <Stage className={className}>
      <div key={animKey} className={`absolute inset-0 ${sceneClassName}`}>
        <SceneRenderer scene={shown} reducedMotion={reducedMotion} animKey={animKey} mini={preview} />
      </div>
      <BrandBar brand={brand} hideLogo={shown.template === "splash"} />
      <Ticker text={ticker} color={shown.accentColor} />
      {progressKey !== undefined && <ProgressBar durationSec={shown.durationSec} animKey={progressKey} color={shown.accentColor} />}
    </Stage>
  );
}
