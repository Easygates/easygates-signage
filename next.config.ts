import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
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
