import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable webpack for compatibility, or configure Turbopack
  // Option 1: Use webpack instead of Turbopack
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
  
  // Option 2: Or use Turbopack with specific config
  turbopack: {
    // Turbopack-specific configurations can go here
  },
  
  // Option 3: Disable Turbopack during development
  experimental: {
    // turbo: {
    //   // Turbopack config if needed
    // }
  }
};

export default nextConfig;