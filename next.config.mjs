import withSerwistInit from "@serwist/next";
const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globPublicPatterns: [],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
};

export default withSerwist(nextConfig);

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: "true",
// });
// module.exports = withBundleAnalyzer(nextConfig);
