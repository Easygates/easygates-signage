"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ScreenView from "@/components/ScreenView";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";
import { DEMO_SCENES, type Scene } from "@/lib/signage";
import { transitionClass } from "@/lib/signage";

function useQuery() {
  const sp = useSearchParams();
  // ?poll=10 → check the CMS every 10s (min 5s, max 5min). Default 30s.
  const rawPoll = Number(sp.get("poll"));
  const pollSec = Number.isFinite(rawPoll) && rawPoll > 0 ? Math.min(300, Math.max(5, rawPoll)) : 30;
  return { playlistId: sp.get("playlistId"), displayId: sp.get("displayId"), pollSec };
}

function DisplayInner() {
  const { playlistId, displayId, pollSec } = useQuery();
  const [scenes, setScenes] = useState<Scene[]>(DEMO_SCENES);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [muted] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reduced motion: OS preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (playlistId) q.set("playlistId", playlistId);
      if (displayId) q.set("displayId", displayId);
      const r = await fetch(`/api/player?${q.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j.scenes?.length) setScenes(j.scenes);
      if (j.brand) setBrand(normalizeBrand(j.brand));
    } catch {
      /* stay on demo */
    }
  }, [playlistId, displayId]);

  useEffect(() => {
    const handles: ReturnType<typeof setTimeout>[] = [];
    const tick = () => handles.push(setTimeout(() => void load(), 0));
    tick();
    const poll = setInterval(tick, pollSec * 1000); // pick up CMS pushes
    return () => { clearInterval(poll); handles.forEach((h) => clearTimeout(h)); };
  }, [load, pollSec]);

  // if the CMS playlist shrinks, don't sit on an index that no longer exists
  if (index >= scenes.length) setIndex(0);

  // heartbeat for multi-display status
  useEffect(() => {
    if (!displayId) return;
    const beat = () => fetch(`/api/displays/${displayId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heartbeat: true }) }).catch(() => {});
    beat();
    const i = setInterval(beat, 20000);
    return () => clearInterval(i);
  }, [displayId]);

  // preload next image (memory-light: only next 1)
  useEffect(() => {
    const next = scenes[(index + 1) % scenes.length]?.imageUrl;
    if (next) {
      const im = new Image();
      im.src = next;
    }
    (scenes[index]?.items || []).slice(0, 4).forEach((it) => {
      if (it.image) {
        const im = new Image();
        im.src = it.image;
      }
    });
  }, [index, scenes]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (reduced) {
        setIndex((i) => (i + dir + scenes.length) % scenes.length);
        return;
      }
      setExiting(true);
      setTimeout(() => {
        setIndex((i) => (i + dir + scenes.length) % scenes.length);
        setExiting(false);
      }, 480);
    },
    [scenes.length, reduced]
  );

  // auto-advance
  useEffect(() => {
    if (paused || scenes.length < 2) return;
    const cur = scenes[index];
    const ms = (cur.durationSec || 10) * 1000;
    timer.current = setTimeout(() => go(1), ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, paused, scenes, go]);

  // keyboard: arrows navigate, space pause, F fullscreen, M reduced, H help
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => {});
      }
      if (e.key.toLowerCase() === "m") setReduced((r) => !r);
      if (e.key.toLowerCase() === "h") setShowHelp((s) => !s);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [go]);

  const scene = scenes[index] ?? DEMO_SCENES[0];
  const tClass = useMemo(() => transitionClass(scene.transition, exiting ? "exit" : "enter"), [scene.transition, exiting]);
  void muted;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white" style={{ cursor: showHelp ? "default" : "none" }}>
      <ScreenView
        scene={scene}
        brand={brand}
        animKey={`${scene.id}-${index}`}
        sceneClassName={tClass}
        reducedMotion={reduced}
        progressKey={paused ? undefined : `${scene.id}-${index}`}
      />

      {paused && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl bg-white p-10 text-center text-black">
            <div className="text-5xl">⏸</div>
            <div className="mt-3 text-2xl font-black">PAUSED</div>
            <div className="mt-1 text-sm opacity-60">Press SPACE to resume · ←/→ to step · F fullscreen</div>
          </div>
        </div>
      )}

      {showHelp && !paused && (
        <div className="absolute bottom-20 left-6 z-40 max-w-sm rounded-2xl bg-black/80 p-5 text-sm leading-relaxed ring-1 ring-white/20 backdrop-blur">
          <div className="font-black tracking-widest">DISPLAY CONTROLS</div>
          <div className="mt-2 opacity-80">←/→ step scene · SPACE pause · F fullscreen · M reduced-motion ({reduced ? "ON" : "OFF"}) · H hide this panel</div>
          <div className="mt-2 opacity-60">Auto-refresh every {pollSec}s picks up CMS pushes (add ?poll=10 for faster). Append ?displayId=… to bind a screen, ?playlistId=… to preview.</div>
        </div>
      )}

      <button onClick={() => setShowHelp((s) => !s)} className="absolute left-4 top-16 z-40 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-widest opacity-0 ring-1 ring-white/20 transition hover:opacity-100" style={{ cursor: "pointer" }}>
        ?
      </button>
    </main>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<main className="grid h-screen place-items-center bg-black text-white">Loading display…</main>}>
      <DisplayInner />
    </Suspense>
  );
}
