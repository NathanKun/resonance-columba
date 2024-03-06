import { Analytics } from "@vercel/analytics/react";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_SC } from "next/font/google";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "科伦巴商会",
  description: "雷索纳斯 科伦巴商会 数据分享站",
};

const inter = Noto_Sans_SC({
  preload: false,
  variable: "--font-noto-sans-sc",
}); // use font-sans

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen`}>
        <header className="flex items-center justify-between w-full p-2">
          <h1 className="text-3xl font-medium">
            <Link href="/">科伦巴商会</Link>
          </h1>
          <Link href="/about">关于</Link>
        </header>
        <main className="relative flex flex-col items-center justify-center">
          <div className="w-full">{children}</div>
        </main>
        {/* <SpeedInsights /> */}
        <Analytics />
      </body>
    </html>
  );
}
