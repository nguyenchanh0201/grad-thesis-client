import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
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
