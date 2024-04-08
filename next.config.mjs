import withSerwistInit from "@serwist/next";
const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globPublicPatterns: [],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/get-prices",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://www.resonance-columba.com" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: "true",
// });
// module.exports = withBundleAnalyzer(nextConfig);
