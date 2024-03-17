// import { Analytics } from "@vercel/analytics/react";
// import { SpeedInsights } from "@vercel/speed-insights/next";
// import { GoogleAnalytics } from "@next/third-parties/google";
import { CssBaseline } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import { GoogleTagManager } from "@next/third-parties/google";
import { Noto_Sans_SC } from "next/font/google";
import { env } from "process";
import Header from "./components/header/header";
import "./globals.css";
import PriceProvider from "./price-provider";

export const metadata = {
  title: "科伦巴商会",
  description: "雷索纳斯 科伦巴商会 数据分享站",

  metadataBase: new URL("https://www.resonance-columba.com"),
  alternates: {
    canonical: "/",
  },
};

const inter = Noto_Sans_SC({
  preload: false,
  variable: "--font-noto-sans-sc",
}); // use font-sans

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" id="root">
      <StyledEngineProvider injectFirst>
        <CssBaseline />
        <body className={`${inter.variable} min-h-screen m-0 bg-black`}>
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
