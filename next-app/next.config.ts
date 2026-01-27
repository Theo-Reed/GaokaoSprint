import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  basePath: "/GaokaoSprint", // <=== IMPORTANT: Replace 'gaokao' with your repository name if it's not a user site
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname, "../"),
  },
};

export default nextConfig;
