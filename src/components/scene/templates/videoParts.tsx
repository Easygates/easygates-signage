import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BrandIcon } from "./brandParts";
import { alpha, type Kit } from "./brandKit";

// Building blocks shared by the two EasyGates Direct video templates.

/**
 * A muted, looping, autoplaying video that fills its (positioned) parent, cropped — never stretched —
 * to cover it. `position` is the focal point (CSS object-position), so the crop can favour the part of
 * the picture that matters. If the file cannot be played the parent shows the placeholder instead.
 */
export function VideoFill({
  src,
  fit = "cover",
  position = "center",
  onFail,
}: {
  src: string;
  fit?: "cover" | "contain";
  position?: string;
  onFail?: (src: string) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // autoplay is only allowed for muted video; set it on the element as well as the attribute
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [src]);
  const style: CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: position, background: "#000", display: "block" };
  return (
    <video
      key={src}
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      onError={() => onFail?.(src)}
      style={style}
    />
  );
}

/** What the video area shows when no video is chosen yet, or the chosen file cannot be played. */
export function VideoMissing({ k, broken, compact = false, top = false }: { k: Kit; broken: boolean; compact?: boolean; top?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: top ? "flex-start" : "center",
        gap: compact ? 12 : 22,
        padding: top ? "210px 40px 40px" : 40,
        boxSizing: "border-box",
        textAlign: "center",
        background: `linear-gradient(160deg, ${alpha(k.accent, 0.16)}, ${alpha(k.bgFrom, 0.9)})`,
        color: k.muted,
      }}
    >
      <BrandIcon id="screen" size={compact ? 64 : 110} color={alpha(k.text, 0.55)} stroke={1.6} />
      <span style={{ fontSize: compact ? 26 : 40, fontWeight: 900, color: k.text }}>{broken ? "This video can't be played" : "Choose a video"}</span>
      <span style={{ maxWidth: 900, fontSize: compact ? 20 : 28, fontWeight: 600, lineHeight: 1.3 }}>
        {broken
          ? "Check the file is an .mp4 or .webm in the videos folder, or that the address is right."
          : "Put an .mp4 in the videos folder on the server, then pick it in the editor (Video → Videos folder)."}
      </span>
    </div>
  );
}

/** Corner brackets drawn around a frame — the technical, trade-catalogue look. */
export function CornerBrackets({ color, inset = 22, size = 64, thickness = 6 }: { color: string; inset?: number; size?: number; thickness?: number }) {
  const edge = `${thickness}px solid ${color}`;
  const common: CSSProperties = { position: "absolute", width: size, height: size, pointerEvents: "none", borderRadius: 4 };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, left: -inset, top: -inset, borderLeft: edge, borderTop: edge }} />
      <span aria-hidden="true" style={{ ...common, right: -inset, top: -inset, borderRight: edge, borderTop: edge }} />
      <span aria-hidden="true" style={{ ...common, left: -inset, bottom: -inset, borderLeft: edge, borderBottom: edge }} />
      <span aria-hidden="true" style={{ ...common, right: -inset, bottom: -inset, borderRight: edge, borderBottom: edge }} />
    </>
  );
}

/** Stateful wrapper: draws the video, or the placeholder when there is none or it fails to load. */
export function VideoOrPlaceholder({ src, fit, position, k, compact, top }: { src: string; fit?: "cover" | "contain"; position?: string; k: Kit; compact?: boolean; top?: boolean }) {
  const [failed, setFailed] = useState("");
  if (!src) return <VideoMissing k={k} broken={false} compact={compact} top={top} />;
  if (failed === src) return <VideoMissing k={k} broken compact={compact} top={top} />;
  return <VideoFill src={src} fit={fit} position={position} onFail={setFailed} />;
}
