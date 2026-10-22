"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ from }: { from: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        setError(j?.error || "Invalid password");
        return;
      }
      router.push(from);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1f] text-white flex items-center justify-center px-5">
      <div className="rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/10 w-full max-w-[360px]">
        <h2 className="font-black mb-6">Sign in to NovaSign</h2>
        <form onSubmit={submit}>
          <label className="block font-black text-xs tracking-widest uppercase text-white/50 mb-2">Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-12 border border-white/12 bg-black/40 px-4 py-3 text-white outline-none focus:border-white"
          />
          {error && <p className="mt-3 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300">{error}</p>}
          <button className="w-full rounded-xl bg-green-500 py-3 text-sm font-black text-black disabled:opacity-50" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-[11px] text-white/50 leading-relaxed">
          The CMS and its write APIs are password protected. Screens (<code className="text-white">/display</code> and <code className="text-white">GET /api/player</code>) stay open and need no login.
          <br />
          Set the <code className="text-white">ADMIN_PASSWORD</code> environment variable on the server to control access.
        </p>
      </div>
    </main>
  );
}
