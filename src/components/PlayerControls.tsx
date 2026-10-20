"use client";

import { useState } from "react";

interface Props {
  displayId: string;
  fullyUrl?: string;
  hasFully?: boolean;
  onSaved: () => void;
  flash: (msg: string) => void;
}

type DeviceInfo = {
  deviceModel?: string;
  appVersion?: string;
  batteryLevel?: number;
  isPlugged?: boolean;
  screenOn?: boolean;
  currentTabUrl?: string;
  ip4?: string;
  kioskMode?: boolean;
  wifiSSID?: string;
};

const btn = "rounded-lg bg-white/10 px-3 py-2 text-[11px] font-black ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-40";

export default function PlayerControls({ displayId, fullyUrl, hasFully, onSaved, flash }: Props) {
  const [url, setUrl] = useState(fullyUrl || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [err, setErr] = useState("");

  const configured = Boolean(fullyUrl) && Boolean(hasFully);

  const save = async () => {
    if (!url.trim()) {
      setErr("Enter the player's Remote Admin URL, e.g. http://192.168.1.61:2323");
      return;
    }
    setBusy("save");
    const settings: Record<string, unknown> = { fullyUrl: url.trim() };
    if (password.trim()) settings.fullyPassword = password.trim();
    const r = await fetch(`/api/displays/${displayId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setBusy(null);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Could not save");
      return;
    }
    setErr("");
    setPassword("");
    flash("Player saved");
    onSaved();
  };

  const run = async (action: "reload" | "restart" | "screenOn" | "screenOff" | "wake" | "info" | "clearCache") => {
    setBusy(action);
    setErr("");
    try {
      const r = await fetch(`/api/displays/${displayId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Command failed");
      } else {
        if (action === "info") setInfo(j.result as DeviceInfo);
        flash(
          action === "info"
            ? "Player reachable"
            : action === "reload"
              ? "Player reloaded"
              : action === "restart"
                ? "Player app restarting"
                : action === "wake"
                  ? "Screen woken + reloaded"
                  : action === "screenOff"
                    ? "Screen off"
                    : action === "screenOn"
                      ? "Screen on"
                      : "Cache cleared"
        );
      }
    } catch {
      setErr("Network error reaching the CMS");
    }
    setBusy(null);
  };

  return (
    <details className="mt-3 rounded-2xl bg-black/25 p-3 ring-1 ring-white/10" open={!configured}>
      <summary className="cursor-pointer text-[11px] font-black tracking-widest text-white/50">
        PLAYER DEVICE (FULLY KIOSK) {configured ? <span className="text-green-300">· CONFIGURED</span> : <span className="text-amber-300">· NOT SET</span>}
      </summary>

      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-[1fr_120px] gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.1.61:2323"
            className="inp !py-2 font-mono text-[11px]"
            spellCheck={false}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder={hasFully ? "••••" : "password"}
            className="inp !py-2 font-mono text-[11px]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={save} disabled={busy !== null} className={`${btn} bg-green-500/20 text-green-200 ring-green-400/40`}>
            {busy === "save" ? "Saving…" : "Save player"}
          </button>
          <button onClick={() => run("info")} disabled={!configured || busy !== null} className={btn}>
            ● Test
          </button>
          <button onClick={() => run("reload")} disabled={!configured || busy !== null} className={btn}>
            ⟳ Reload
          </button>
          <button onClick={() => run("wake")} disabled={!configured || busy !== null} className={btn}>
            ☀ Wake
          </button>
          <button onClick={() => run("screenOn")} disabled={!configured || busy !== null} className={btn}>
            Screen on
          </button>
          <button onClick={() => run("screenOff")} disabled={!configured || busy !== null} className={btn}>
            Screen off
          </button>
          <button onClick={() => run("restart")} disabled={!configured || busy !== null} className={btn}>
            ↻ Restart
          </button>
          <button onClick={() => run("clearCache")} disabled={!configured || busy !== null} className={btn}>
            Clear cache
          </button>
          <a
            href={`/api/displays/${displayId}/control`}
            target="_blank"
            rel="noreferrer"
            className={`${btn} ${configured ? "" : "pointer-events-none opacity-40"}`}
          >
            📷 Screenshot
          </a>
        </div>

        {err && <p className="rounded-lg bg-red-500/15 px-2 py-1.5 text-[11px] text-red-200 ring-1 ring-red-400/30">{err}</p>}

        {info && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-white/5 p-2 font-mono text-[10px] leading-relaxed text-white/70">
            <span>model: {info.deviceModel || "—"}</span>
            <span>app: {info.appVersion || "—"}</span>
            <span>screen: {info.screenOn ? "on" : "off"}</span>
            <span>kiosk: {info.kioskMode ? "yes" : "no"}</span>
            <span>battery: {info.batteryLevel ?? "—"}{info.isPlugged ? "% ⚡" : "%"}</span>
            <span>ip: {info.ip4 || "—"}</span>
            <span className="col-span-2 truncate">url: {info.currentTabUrl || "—"}</span>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-white/35">
          Fully Kiosk → Settings → Remote Administration (PLUS): enable it, set a password, allow from local network. Give each
          player a DHCP reservation. Password is stored on the CMS and never sent to the browser.
        </p>
      </div>
    </details>
  );
}
