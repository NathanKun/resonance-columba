// import { Analytics } from "@vercel/analytics/react";
// import { SpeedInsights } from "@vercel/speed-insights/next";
// import { GoogleAnalytics } from "@next/third-parties/google";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider } from "@mui/material/styles";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { env } from "process";
import Header from "./components/header/header";
import "./globals.css";
import PriceProvider from "./price-provider";

export const metadata: Metadata = {
  title: "科伦巴商会",
  description: "雷索纳斯 科伦巴商会 数据分享站",

  metadataBase: new URL("https://www.resonance-columba.com"),
  alternates: {
    canonical: "/",
  },
};

// Prevent automatic scale when focusing input (these will not affect the PC)
export const viewport: Viewport = {
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  width: "device-width",
  // I think it's better to prevent scaling on mobile because there's nothing worth scaling on the website.
  // However, this is not work for iOS. It can only be solved by js, so forget it.
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" id="root">
      <StyledEngineProvider injectFirst>
        <CssBaseline />
        <body className="min-h-screen m-0">
          <PriceProvider>
            <Header />
            <main className="relative flex flex-col items-center justify-center">
              <div className="w-full">{children}</div>
            </main>
          </PriceProvider>
        </body>
      </StyledEngineProvider>
      <GoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER!} />
    </html>
  );
}
