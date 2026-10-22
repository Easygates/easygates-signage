import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaSign — Retail Digital Signage",
  description: "Professional animated signage player + CMS. 7 broadcast templates, animation engine, playlists, multi-display.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#05070f] text-white antialiased">{children}</body>
    </html>
  );
}
