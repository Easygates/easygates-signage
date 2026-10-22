"use client";

import { useEffect, useState } from "react";

const KEY = "sg_screen_base";
const isLocalhost = (u: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(u);

/**
 * The server address a TV should open. Defaults to the address this admin is open on; when that is
 * localhost (only reachable from this PC) it uses the PC's Wi-Fi/LAN address instead. Editable, and
 * remembered in this browser.
 */
export function useScreenBase() {
  const [base, setBaseState] = useState("");
  const [lan, setLan] = useState<string[]>([]);

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(KEY) || ""; } catch { /* storage unavailable */ }
    const origin = window.location.origin;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only values once on mount
    setBaseState(saved || origin);
    if (!isLocalhost(origin)) return;
    fetch("/api/server-info")
      .then((r) => r.json())
      .then((j: { lan?: string[] }) => {
        const found = j.lan || [];
        setLan(found);
        if (!saved && found[0]) setBaseState(found[0]);
      })
      .catch(() => {});
  }, []);

  const setBase = (v: string) => {
    const clean = v.trim().replace(/\/+$/, "");
    setBaseState(clean);
    try { if (clean) localStorage.setItem(KEY, clean); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  };

  return { base, setBase, lan, local: isLocalhost(base) };
}

export function ScreenBasePanel({ base, setBase, lan, local }: ReturnType<typeof useScreenBase>) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <label className="lbl" htmlFor="screen-base">Server address for your TVs</label>
      <input id="screen-base" value={base} onChange={(e) => setBase(e.target.value)} placeholder="http://192.168.1.50:3000" className="inp font-mono" spellCheck={false} />
      {local && (
        <p className="mt-2 text-xs font-bold text-amber-300">
          &ldquo;localhost&rdquo; only works on this PC. A TV can&apos;t open it — use your PC&apos;s network address{lan.length ? " (suggested below)" : ""} or your online site address.
        </p>
      )}
      {lan.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {lan.map((u) => (
            <button key={u} onClick={() => setBase(u)} className="rounded-full bg-white/10 px-3 py-1 font-mono ring-1 ring-white/15 hover:bg-white/20">{u}</button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-white/40">Detected automatically from the address you opened this page on. Change it if your TVs reach the server a different way. Saved in this browser only.</p>
    </div>
  );
}

/** Read-only URL box for one screen, with a copy button. */
export function ScreenUrl({ url, onCopied }: { url: string; onCopied: () => void }) {
  return (
    <div className="mt-3 flex items-stretch gap-2">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Screen URL" className="min-w-0 flex-1 rounded-xl bg-black/40 px-3 py-2 font-mono text-[11px] text-white/80 ring-1 ring-white/15" />
      <button
        onClick={async () => { try { await navigator.clipboard.writeText(url); onCopied(); } catch { /* clipboard blocked: the box is selectable */ } }}
        className="shrink-0 rounded-xl bg-white/10 px-3 text-xs font-black ring-1 ring-white/20 hover:bg-white/20"
      >COPY</button>
    </div>
  );
}
