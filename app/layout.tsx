import { CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { StyledEngineProvider } from "@mui/material/styles";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { env } from "process";
import MuiThemeProvider from "./components/MuiThemeProvider";
import Header from "./components/header/header";
import "./globals.css";
import PriceProvider from "./price-provider";

const APP_NAME = "科伦巴商会";
const APP_DEFAULT_TITLE = "科伦巴商会";
const APP_TITLE_TEMPLATE = "科伦巴商会 - %s";
const APP_DESCRIPTION = "雷索纳斯 科伦巴商会 跑商数据站";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },

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
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" id="root">
      <body className="min-h-screen m-0">
        <StyledEngineProvider injectFirst>
          <AppRouterCacheProvider>
            <PriceProvider>
              <MuiThemeProvider>
                <CssBaseline />
                <Header />
                <main className="relative flex flex-col items-center justify-center">
                  <div className="w-full">{children}</div>
                </main>
              </MuiThemeProvider>
            </PriceProvider>
          </AppRouterCacheProvider>
        </StyledEngineProvider>
      </body>
      <GoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER!} />
    </html>
  );
}
