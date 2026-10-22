"use client";

import { Suspense } from "react";
import PlaylistExport from "@/components/PlaylistExport";

export default function ExportPage() {
  return (
    <Suspense fallback={<main className="grid h-screen place-items-center bg-black text-white">Loading playlist export…</main>}>
      <PlaylistExport />
    </Suspense>
  );
}
