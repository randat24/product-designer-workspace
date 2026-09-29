import type { NextConfig } from "next";

const config: NextConfig = {
  typedRoutes: false,
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default config;
