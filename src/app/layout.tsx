import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Play } from "next/font/google";
import "./globals.css";

/* next/font self-hosts the files at build time — no runtime request to
   Google, and no layout shift from a late-arriving webfont.
   Play ships only 400 and 700. */
const play = Play({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-play",
});
import { CartProvider } from "@/components/CartProvider";
import TelegramProvider from "@/components/TelegramProvider";
import CartBar from "@/components/CartBar";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore";

export const metadata: Metadata = {
  title: `${storeName} — Shop`,
  description: "Browse products and order without leaving Telegram.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1720" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* telegram-web-app.js writes --tg-viewport-* onto <html> before React
       hydrates, so the server and client markup legitimately differ here. */
    <html lang="en" className={play.variable} suppressHydrationWarning>
      {/* suppressHydrationWarning only covers one level, so <body> needs its
          own: extensions like Grammarly add data-gr-* attributes here before
          React hydrates. */}
      <body className="min-h-screen" suppressHydrationWarning>
        {/* beforeInteractive so window.Telegram exists on first render. It
            lives in <body> because a <script> may not be a direct child of
            <html>; Next hoists it into the document head when rendering. */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <CartProvider>
          <TelegramProvider />
          {/* Pages own their bottom padding — the action bars are fixed. */}
          <div className="mx-auto w-full max-w-2xl">{children}</div>
          <CartBar />
        </CartProvider>
      </body>
    </html>
  );
}
