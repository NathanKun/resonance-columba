import withSerwistInit from "@serwist/next";
import webpack from "webpack";

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globPublicPatterns: [],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 1,
        })
      );
    }
    return config;
  },
};

export default withSerwist(nextConfig);

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: "true",
// });
// module.exports = withBundleAnalyzer(nextConfig);
