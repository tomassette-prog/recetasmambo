import type { NextConfig } from "next";
import legacyRedirects from "./src/lib/legacy-redirects.json";

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects.map((r) => ({ ...r, permanent: true }));
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.thermorecetas.com" },
    ],
  },
};

export default nextConfig;
