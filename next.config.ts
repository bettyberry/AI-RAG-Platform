import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  
  turbopack: {
  },
  
  experimental: {
  
  }
};

export default nextConfig;