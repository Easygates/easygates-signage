import { NextResponse } from "next/server";
import { networkInterfaces } from "node:os";

export const dynamic = "force-dynamic";

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

/**
 * Network addresses of the machine running the CMS, so the Displays tab can show URLs a TV on the
 * same Wi-Fi can open (localhost only works on this PC). Only answers when the CMS itself is being
 * opened locally; a hosted site returns nothing.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hostHeader = req.headers.get("host") || url.host;
  const hostname = hostHeader.replace(/:\d+$/, "");
  const port = hostHeader.match(/:(\d+)$/)?.[1] || "";
  if (!LOCAL_HOST.test(hostname)) return NextResponse.json({ lan: [] });

  const lan: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === "IPv4" && !a.internal) lan.push(`http://${a.address}${port ? `:${port}` : ""}`);
    }
  }
  return NextResponse.json({ lan });
}
