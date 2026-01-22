import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",  // <=== Enable static export
  basePath: "/GaokaoSprint", // <=== IMPORTANT: Replace 'gaokao' with your repository name if it's not a user site
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
