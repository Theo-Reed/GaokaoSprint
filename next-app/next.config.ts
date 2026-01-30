import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    'react-markdown', 
    'remark-math', 
    'rehype-katex', 
    'katex', 
    'remark-gfm',
    'micromark-extension-math',
    'micromark-extension-gfm'
  ],
  turbopack: {
    root: path.resolve(__dirname, "../"),
  },
};

export default nextConfig;
