import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Vercel KV for Redis Next.js Starter",
  description: "A simple Next.js app with Vercel KV for Redis as the database",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <main className="relative flex min-h-screen flex-col items-center justify-center">
          <h1 className="pt-2 pb-2 bg-gradient-to-br text-center text-3xl font-medium">
            <Link href="/">科伦巴商会</Link>
          </h1>
          <div className="w-full">{children}</div>
        </main>
      </body>
    </html>
  );
}
