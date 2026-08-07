import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // allowed dev origins
  allowedDevOrigins: ["*"],

  images: {
    localPatterns: [
      // `search` omitted on purpose: file_photos ships with a `?v=<hash>` cache-buster
      // (see web/scripts/generate-photo-manifest.mjs) that changes on every photo update.
      { pathname: "/file_photos/**" },
      // Static UI art (loading screen, camera shell chrome) referenced by next/image.
      { pathname: "/elements/**" },
    ],
  },
};

export default nextConfig;
