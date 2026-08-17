import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import TelegramProvider from "@/components/TelegramProvider";
import CartBar from "@/components/CartBar";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore"} — Shop`,
  description: "Browse products and order without leaving Telegram.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Must run before hydration so window.Telegram exists on first render. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-tg-bg text-tg-text antialiased">
        <CartProvider>
          <TelegramProvider />
          <div className="mx-auto w-full max-w-2xl pb-24">{children}</div>
          <CartBar />
        </CartProvider>
      </body>
    </html>
  );
}
