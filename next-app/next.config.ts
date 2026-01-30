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
    'micromark-extension-gfm',
    'mdast-util-gfm',
    'mdast-util-gfm-autolink-literal',
    'micromark-extension-gfm-autolink-literal',
    'mdast-util-find-and-replace'
  ],
  turbopack: {
    root: path.resolve(__dirname, "../"),
  },
};

export default nextConfig;
