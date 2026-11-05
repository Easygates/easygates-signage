import type { NextConfig } from "next";
import { resolveAllowedDevOrigins } from "./src/lib/devOrigins.ts";

/**
 * Absolute path of this project (the folder holding `next.config.ts`).
 *
 * Next.js compiles this config to CommonJS, so `__dirname` is the config's own
 * folder. ESM consumers (the `node --test` suite imports this file directly)
 * have no `__dirname`, hence the fallback.
 */
const projectRoot = (() => {
  try {
    return __dirname;
  } catch {
    return process.cwd();
  }
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: resolveAllowedDevOrigins(),
  // Pin the project root. Without this, Next works it out from lockfiles found
  // *above* the project: an orphaned `package-lock.json` in C:\Users\<you> or
  // C:\Users\<you>\Documents (left behind by an `npm install` run in the wrong
  // folder) is picked up as the workspace root. Everything is then resolved from
  // that folder, so Tailwind's `@import "tailwindcss"` fails with:
  //   Can't resolve 'tailwindcss' in 'C:\Users\TV-Serve\Documents'
  // even though node_modules is right here. See vercel/next.js#92978.
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.com" },
    ],
  },
  // Runtime uploads (public/uploads) aren't served by `next start` unless they
  // existed at build time, so /uploads/* is proxied to the API route that
  // reads disk per request. Legacy /uploads/* asset URLs keep working.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
};

export default nextConfig;
