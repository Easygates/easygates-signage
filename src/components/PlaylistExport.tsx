"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ScreenView from "@/components/ScreenView";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";
import { transitionClass, type Scene } from "@/lib/signage";
import type { StreamTargetChunk } from "mediabunny";

type SaveFileHandle = {
  name: string;
  createWritable(): Promise<WritableStream<unknown>>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
    excludeAcceptAllOption: boolean;
  }) => Promise<SaveFileHandle>;
};

type MediaBunny = typeof import("mediabunny");

type ExportPhase = "idle" | "requesting" | "preparing" | "recording" | "finalizing" | "done" | "error";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const FRAME_RATE = 30;
const BITRATE = 8_000_000;
const TRANSITION_MS = 480; // Matches the signage player's scene hand-off.
const FRAME_MS = 1000 / FRAME_RATE;

function sceneDurationMs(scene: Scene): number {
  const seconds = Number(scene.durationSec);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 10) * 1000;
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function filenameFor(name: string): string {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "playlist";
  return `${safe}-${new Date().toISOString().slice(0, 10)}.mp4`;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(finish, 5000);
    function finish() {
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve();
    }
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    if (image.complete) finish();
  });
}

function waitForPaint(count = 1): Promise<void> {
  return new Promise((resolve) => {
    const next = (left: number) => {
      requestAnimationFrame(() => {
        if (left <= 1) resolve();
        else next(left - 1);
      });
    };
    next(count);
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

function nextAnimationFrame(signal: AbortSignal): Promise<number> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(performance.now());
      return;
    }
    let request = 0;
    const cleanup = () => signal.removeEventListener("abort", aborted);
    const aborted = () => {
      cancelAnimationFrame(request);
      cleanup();
      resolve(performance.now());
    };
    request = requestAnimationFrame((timestamp) => {
      cleanup();
      resolve(timestamp);
    });
    signal.addEventListener("abort", aborted, { once: true });
  });
}

function isThisTabBeingShared(video: HTMLVideoElement): boolean {
  if (!video.videoWidth || !video.videoHeight || !window.innerWidth || !window.innerHeight) return false;
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  try {
    const centerX = video.videoWidth / 2;
    const centerY = video.videoHeight / 2;
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;
    const sample = (x: number, y: number) => {
      context.drawImage(video, x - 1, y - 1, 2, 2, 0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data;
    };
    // During setup the export page briefly shows four known colours at its centre.
    // This prevents accidentally recording another tab that was chosen in the picker.
    const mint = sample(centerX - 12 * scaleX, centerY - 12 * scaleY);
    const navy = sample(centerX + 12 * scaleX, centerY - 12 * scaleY);
    const pink = sample(centerX - 12 * scaleX, centerY + 12 * scaleY);
    const yellow = sample(centerX + 12 * scaleX, centerY + 12 * scaleY);
    return mint[0] < 110 && mint[1] > 150 && mint[2] > 90
      && navy[0] < 70 && navy[1] < 100 && navy[2] < 150
      && pink[0] > 150 && pink[1] < 180 && pink[2] > 160
      && yellow[0] > 170 && yellow[1] > 140 && yellow[2] < 130;
  } catch {
    return false;
  }
}

function drawStageFrame(video: HTMLVideoElement, context: CanvasRenderingContext2D) {
  context.fillStyle = "#000";
  context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  if (!video.videoWidth || !video.videoHeight) return;

  // The player always centers its 16:9 stage in the shared tab. Crop the tab's
  // letterbox so the MP4 is the clean 1920×1080 stage, even on a 16:10 screen.
  const targetAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  const sourceAspect = video.videoWidth / video.videoHeight;
  let sx = 0;
  let sy = 0;
  let sw = video.videoWidth;
  let sh = video.videoHeight;
  if (sourceAspect > targetAspect) {
    sw = video.videoHeight * targetAspect;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / targetAspect;
    sy = (video.videoHeight - sh) / 2;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
}

async function captureFrames({
  video,
  context,
  source,
  startedAt,
  totalMs,
  signal,
  onProgress,
}: {
  video: HTMLVideoElement;
  context: CanvasRenderingContext2D;
  source: InstanceType<MediaBunny["CanvasSource"]>;
  startedAt: number;
  totalMs: number;
  signal: AbortSignal;
  onProgress: (elapsed: number) => void;
}): Promise<number> {
  let frames = 0;
  let lastFrameAt = -Infinity;
  let lastProgressAt = 0;

  while (!signal.aborted) {
    const timestamp = await nextAnimationFrame(signal);
    if (signal.aborted) break;
    if (timestamp - lastFrameAt < FRAME_MS - 1) continue;

    const elapsedMs = Math.max(0, timestamp - startedAt);
    drawStageFrame(video, context);
    await source.add(elapsedMs / 1000, FRAME_MS / 1000);
    lastFrameAt = timestamp;
    frames += 1;

    if (timestamp - lastProgressAt >= 500) {
      onProgress(Math.min(elapsedMs, totalMs));
      lastProgressAt = timestamp;
    }
  }

  return frames;
}

function renderError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Screen sharing was cancelled. Click Record playlist to MP4 again when you’re ready.";
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return "The export was cancelled before recording started.";
  }
  if (error instanceof Error) return error.message;
  return "The MP4 export failed. Please try again in Chrome or Edge.";
}

export default function PlaylistExport() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("playlistId");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [playlistName, setPlaylistName] = useState("Playlist");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<ExportPhase>("idle");
  const [support, setSupport] = useState<{ state: "checking" | "ready" | "unsupported"; message: string }>({ state: "checking", message: "Checking this browser…" });
  const [destinationName, setDestinationName] = useState("");
  const [choosingFile, setChoosingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [renderSession, setRenderSession] = useState(0);
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  const mediaBunnyRef = useRef<MediaBunny | null>(null);
  const fileHandleRef = useRef<SaveFileHandle | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeOutputRef = useRef<import("mediabunny").Output | null>(null);
  const activeWritableRef = useRef<WritableStream<unknown> | null>(null);

  const totalMs = useMemo(() => {
    if (!scenes.length) return 0;
    return scenes.reduce((sum, scene) => sum + sceneDurationMs(scene), 0) + Math.max(0, scenes.length - 1) * TRANSITION_MS;
  }, [scenes]);

  const currentScene = scenes[index];
  const isRecordingView = phase === "recording";
  const progress = totalMs ? Math.min(1, elapsedMs / totalMs) : 0;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!playlistId) {
        setLoadError("Open Export MP4 from a playlist in Admin to choose a playlist.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/player?playlistId=${encodeURIComponent(playlistId)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this playlist.");
        if (data.playlist?.id !== playlistId) throw new Error("This playlist no longer exists.");
        if (!data.playlist?.items?.length || !data.scenes?.length) throw new Error("This playlist has no scenes to export yet.");
        const loadedScenes = data.scenes as Scene[];
        const loadedBrand = normalizeBrand(data.brand);
        setScenes(loadedScenes);
        setBrand(loadedBrand);
        setPlaylistName(data.playlist.name || "Playlist");
        const imageUrls = new Set([
          loadedBrand.logoUrl,
          loadedBrand.defaultBgImageUrl,
          ...loadedScenes.flatMap((scene) => [scene.imageUrl, scene.bgImageUrl, ...(scene.items || []).map((item) => item.image)]),
        ].filter((url): url is string => typeof url === "string" && url.length > 0));
        await Promise.all(Array.from(imageUrls, preloadImage));
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load this playlist.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [playlistId]);

  useEffect(() => {
    let active = true;
    async function checkSupport() {
      // Let the component finish mounting before updating the support state.
      await Promise.resolve();
      if (!active) return;
      const pickerWindow = window as SavePickerWindow;
      if (!window.isSecureContext) {
        setSupport({ state: "unsupported", message: "MP4 export needs a secure page. Open the app on this computer at localhost, or use its HTTPS address." });
        return;
      }
      if (!navigator.mediaDevices?.getDisplayMedia || !("VideoEncoder" in window) || !pickerWindow.showSaveFilePicker) {
        setSupport({ state: "unsupported", message: "Use a current desktop version of Chrome or Edge for tab capture, H.264 encoding and direct-to-file MP4 export." });
        return;
      }
      try {
        const mediaBunny = await import("mediabunny");
        const canEncode = await mediaBunny.canEncodeVideo("avc", {
          width: OUTPUT_WIDTH,
          height: OUTPUT_HEIGHT,
          frameRate: FRAME_RATE,
          quality: new mediaBunny.Quality({ bitrate: BITRATE }),
          latencyMode: "realtime",
        });
        if (!active) return;
        mediaBunnyRef.current = mediaBunny;
        setSupport(canEncode
          ? { state: "ready", message: "This browser can record 1080p H.264 MP4." }
          : { state: "unsupported", message: "This browser cannot encode H.264 at 1080p. Try a current Chrome or Edge browser on a desktop with hardware video encoding." });
      } catch {
        if (active) setSupport({ state: "unsupported", message: "Could not initialize the browser’s MP4 encoder. Try a current Chrome or Edge browser." });
      }
    }
    void checkSupport();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const label = phase === "recording"
      ? `Recording ${Math.round(progress * 100)}%`
      : phase === "preparing"
        ? "Preparing MP4 export"
        : phase === "finalizing"
          ? "Finishing MP4 export"
          : "Export playlist to MP4";
    document.title = `${label} · ${playlistName} — NovaSign`;
    return () => { document.title = "NovaSign — Retail Digital Signage"; };
  }, [phase, playlistName, progress]);

  useEffect(() => () => {
    activeStreamRef.current?.getTracks().forEach((track) => track.stop());
    void activeOutputRef.current?.cancel().catch(() => {});
    void activeWritableRef.current?.abort?.().catch(() => {});
  }, []);

  const chooseDestination = async () => {
    const picker = (window as SavePickerWindow).showSaveFilePicker;
    if (!picker) return;
    setChoosingFile(true);
    setErrorMessage("");
    setResultMessage("");
    try {
      const handle = await picker({
        suggestedName: filenameFor(playlistName),
        types: [{ description: "MPEG-4 video", accept: { "video/mp4": [".mp4"] } }],
        excludeAcceptAllOption: true,
      });
      fileHandleRef.current = handle;
      setDestinationName(handle.name);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setErrorMessage(renderError(error));
      }
    } finally {
      setChoosingFile(false);
    }
  };

  const playOnePass = useCallback(async (signal: AbortSignal) => {
    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
      await wait(sceneDurationMs(scenes[sceneIndex]), signal);
      if (signal.aborted) return;
      if (sceneIndex < scenes.length - 1) {
        setExiting(true);
        await wait(TRANSITION_MS, signal);
        if (signal.aborted) return;
        setIndex(sceneIndex + 1);
        setExiting(false);
        await waitForPaint();
      }
    }
  }, [scenes]);

  const startExport = async () => {
    if (support.state !== "ready" || !fileHandleRef.current || !scenes.length || phase === "recording") return;
    setErrorMessage("");
    setResultMessage("");
    setElapsedMs(0);
    setPhase("requesting");

    const abortController = new AbortController();
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let output: import("mediabunny").Output | null = null;
    let writable: WritableStream<unknown> | null = null;
    let source: InstanceType<MediaBunny["CanvasSource"]> | null = null;
    let track: MediaStreamTrack | null = null;
    let playlistCompleted = false;
    let capturedMs = 0;
    let frameError: unknown = null;
    const onTrackEnded = () => {
      abortController.abort();
    };

    try {
      // Must be called directly from the button gesture; the browser will ask which tab to share.
      const captureOptions = {
        video: {
          frameRate: { ideal: FRAME_RATE, max: FRAME_RATE },
          cursor: "never",
          displaySurface: "browser",
        },
        audio: false,
        preferCurrentTab: true,
      } as unknown as DisplayMediaStreamOptions;
      stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
      activeStreamRef.current = stream;
      track = stream.getVideoTracks()[0] || null;
      if (!track) throw new Error("The browser did not provide a video capture track.");
      const displaySurface = (track.getSettings() as MediaTrackSettings & { displaySurface?: string }).displaySurface;
      if (displaySurface && displaySurface !== "browser") {
        throw new Error("In the share picker, choose this browser tab (not a window or your whole screen) so the MP4 contains only the playlist.");
      }
      track.addEventListener("ended", onTrackEnded, { once: true });

      setPhase("preparing");
      const handle = fileHandleRef.current;
      if (!handle) throw new Error("Choose a destination MP4 file first.");
      writable = await handle.createWritable();
      activeWritableRef.current = writable;

      const mediaBunny = mediaBunnyRef.current ?? await import("mediabunny");
      const context = document.createElement("canvas").getContext("2d", { alpha: false });
      if (!context) throw new Error("This browser could not create a 1080p video canvas.");
      const canvas = context.canvas;
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.style.cssText = "position:fixed;left:-2px;top:-2px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1";
      video.srcObject = stream;
      document.body.appendChild(video);
      await video.play();
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("The shared browser tab did not start sending video.")), 8000);
        const check = () => {
          if (video?.videoWidth && video.videoHeight) {
            window.clearTimeout(timeout);
            resolve();
          } else if (abortController.signal.aborted) {
            window.clearTimeout(timeout);
            reject(new Error("Screen sharing stopped before the video was ready."));
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
      const verifyDeadline = performance.now() + 3000;
      let thisTabConfirmed = false;
      while (performance.now() < verifyDeadline && !abortController.signal.aborted) {
        if (isThisTabBeingShared(video)) {
          thisTabConfirmed = true;
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }
      if (!thisTabConfirmed) {
        throw new Error("Couldn’t confirm that the share picker selected this tab. Try again and choose This Tab so only the playlist is recorded.");
      }

      const target = new mediaBunny.StreamTarget(writable as unknown as WritableStream<StreamTargetChunk>);
      output = new mediaBunny.Output({
        format: new mediaBunny.Mp4OutputFormat({ fastStart: "reserve" }),
        target,
      });
      source = new mediaBunny.CanvasSource(canvas, {
        codec: "avc",
        quality: new mediaBunny.Quality({ bitrate: BITRATE }),
        latencyMode: "realtime",
        hardwareAcceleration: "no-preference",
        keyFrameInterval: 2,
      });
      output.addVideoTrack(source, {
        frameRate: FRAME_RATE,
        maximumPacketCount: Math.ceil((totalMs / 1000) * FRAME_RATE) + FRAME_RATE * 5,
        name: playlistName,
      });
      output.setMetadataTags({ title: playlistName, artist: brand.businessName });
      activeOutputRef.current = output;
      await output.start();

      setPhase("recording");
      await waitForPaint(2); // Remove setup controls and the temporary share-check marker.
      setRenderSession((session) => session + 1);
      setIndex(0);
      setExiting(false);
      await waitForPaint(); // Restart the scene entrance with a clean, full-frame player.
      const startedAt = performance.now();
      const framePromise = captureFrames({
        video,
        context,
        source,
        startedAt,
        totalMs,
        signal: abortController.signal,
        onProgress: (elapsed) => { capturedMs = elapsed; setElapsedMs(elapsed); },
      }).catch((error: unknown) => {
        frameError = error;
        abortController.abort();
        return 0;
      });

      await playOnePass(abortController.signal);
      playlistCompleted = !abortController.signal.aborted;
      abortController.abort();
      const frameCount = await framePromise;
      if (frameError) throw frameError;
      if (frameCount === 0) throw new Error("No video frames were captured. Try sharing this browser tab again.");

      track.removeEventListener("ended", onTrackEnded);
      stream.getTracks().forEach((streamTrack) => streamTrack.stop());
      activeStreamRef.current = null;
      setPhase("finalizing");
      source.close();
      await output.finalize();
      activeOutputRef.current = null;
      activeWritableRef.current = null;
      setElapsedMs(playlistCompleted ? totalMs : capturedMs);
      setResultMessage(playlistCompleted
        ? `${handle.name} is saved. The MP4 is 1920×1080 H.264 with no audio.`
        : `Screen sharing stopped early. A partial MP4 has been saved as ${handle.name}.`);
      setPhase("done");
    } catch (error) {
      abortController.abort();
      if (track) track.removeEventListener("ended", onTrackEnded);
      if (stream) stream.getTracks().forEach((streamTrack) => streamTrack.stop());
      activeStreamRef.current = null;
      if (output) {
        await output.cancel().catch(() => {});
        if (activeOutputRef.current === output) activeOutputRef.current = null;
      }
      if (writable) {
        await writable.abort().catch(() => {});
        if (activeWritableRef.current === writable) activeWritableRef.current = null;
      }
      setErrorMessage(renderError(error));
      setPhase("error");
    } finally {
      if (video) {
        video.pause();
        video.srcObject = null;
        video.remove();
      }
      if (activeStreamRef.current === stream) activeStreamRef.current = null;
    }
  };

  const hidePanel = isRecordingView;
  const sceneTransition = currentScene ? transitionClass(currentScene.transition, exiting ? "exit" : "enter") : "";

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-black text-white" style={{ cursor: isRecordingView ? "none" : "default" }}>
      {currentScene && (
        <ScreenView
          scene={currentScene}
          brand={brand}
          animKey={`${currentScene.id}-${index}-${renderSession}`}
          sceneClassName={sceneTransition}
          reducedMotion={false}
          progressKey={`${currentScene.id}-${index}-${renderSession}`}
        />
      )}

      {phase === "preparing" && (
        <div aria-hidden="true" className="fixed left-1/2 top-1/2 z-[100] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 grid-cols-2 grid-rows-2">
          <span className="bg-[#19efa9]" /><span className="bg-[#101827]" />
          <span className="bg-[#e879f9]" /><span className="bg-[#facc15]" />
        </div>
      )}

      {!hidePanel && (
        <aside className="absolute bottom-5 left-5 z-50 w-[min(560px,calc(100vw-2.5rem))] max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f1f]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:bottom-8 sm:left-8 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href="/admin?tab=playlists" className="text-xs font-bold uppercase tracking-[0.16em] text-white/55 hover:text-white">← Back to playlists</Link>
              <div className="mt-3 text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">Playlist export</div>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">Export MP4 video</h1>
              <p className="mt-1 max-w-md truncate text-sm text-white/65" title={playlistName}>{playlistName}</p>
            </div>
            <span className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-right text-[11px] font-bold leading-5 text-white/70">
              1080p<br />H.264 · 30 fps
            </span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm text-white/65">Loading playlist…</div>
          ) : loadError ? (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{loadError}</div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/[0.06] p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Scenes</div>
                  <div className="mt-1 font-black">{scenes.length}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.06] p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/45">One pass</div>
                  <div className="mt-1 font-black">≈ {formatDuration(totalMs)}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-white/80">How it works</div>
                <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/65">
                  <li><b className="text-white">1.</b> Choose where to save the MP4.</li>
                  <li><b className="text-white">2.</b> Start recording, then select <b className="text-white">This Tab</b> in the browser share picker.</li>
                  <li><b className="text-white">3.</b> Keep this tab open. It records one real-time pass with the slides, animations and transitions; the tab title shows progress.</li>
                </ol>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-white/65" role="status">
                {support.message}
              </div>

              {destinationName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs ring-1 ring-emerald-300/20">
                  <span className="min-w-0 truncate text-emerald-100" title={destinationName}>Saving to <b>{destinationName}</b></span>
                  <button onClick={chooseDestination} disabled={choosingFile || support.state !== "ready"} className="shrink-0 font-black text-emerald-200 underline underline-offset-2 disabled:opacity-40">Change</button>
                </div>
              )}

              {phase === "preparing" && <p className="mt-3 text-xs text-sky-200">Verifying the shared tab and preparing the 1080p encoder…</p>}
              {phase === "finalizing" && <p className="mt-3 text-xs text-sky-200">Finalizing the MP4 file…</p>}
              {errorMessage && <div className="mt-3 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-xs leading-relaxed text-red-100">{errorMessage}</div>}
              {resultMessage && <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs leading-relaxed text-emerald-100">{resultMessage}</div>}

              <div className="mt-4 flex flex-wrap gap-2">
                {!destinationName ? (
                  <button onClick={chooseDestination} disabled={support.state !== "ready" || choosingFile || !scenes.length} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-45">
                    {choosingFile ? "Choose a location…" : "Choose MP4 destination"}
                  </button>
                ) : (
                  <button onClick={startExport} disabled={support.state !== "ready" || phase === "requesting" || phase === "preparing" || phase === "finalizing" || !scenes.length} className="rounded-xl bg-sky-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-45">
                    {phase === "requesting" ? "Select this tab in the picker…" : phase === "preparing" ? "Preparing…" : phase === "finalizing" ? "Finishing MP4…" : phase === "done" ? "Export again" : phase === "error" ? "Try again" : "▶ Record playlist to MP4"}
                  </button>
                )}
                {phase === "done" && <button onClick={() => { setPhase("idle"); setErrorMessage(""); setResultMessage(""); setElapsedMs(0); setIndex(0); setExiting(false); }} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/15 hover:bg-white/15">Preview again</button>}
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-white/40">Export runs on this computer—no server-side FFmpeg install or upload. The MP4 has no audio. Screen capture requires Chrome/Edge on localhost or HTTPS.</p>
            </>
          )}
        </aside>
      )}

      {!loading && !currentScene && !loadError && <div className="absolute inset-0 grid place-items-center bg-black text-white/70">Preparing playlist…</div>}
    </main>
  );
}
