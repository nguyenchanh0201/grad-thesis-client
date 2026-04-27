import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "play.google.com",
      },
      {
        protocol: "https",
        hostname: "developer.apple.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/events",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
