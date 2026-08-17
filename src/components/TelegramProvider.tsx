"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { tg } from "@/lib/telegram";

/**
 * Boots the Telegram WebApp SDK: expands the viewport, mirrors Telegram's
 * theme colours into CSS variables, and wires the native back button to
 * the router. Renders nothing — safe to use outside Telegram too, where
 * `tg()` is null and the CSS fallbacks in globals.css take over.
 */
export default function TelegramProvider() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const app = tg();
    if (!app) return;

    app.ready();
    app.expand();

    const applyTheme = () => {
      const root = document.documentElement;
      for (const [key, value] of Object.entries(app.themeParams ?? {})) {
        root.style.setProperty(`--tg-${key.replace(/_/g, "-")}`, value);
      }
      root.dataset.theme = app.colorScheme;
    };

    applyTheme();
    app.onEvent("themeChanged", applyTheme);
    return () => app.offEvent("themeChanged", applyTheme);
  }, []);

  useEffect(() => {
    const app = tg();
    if (!app) return;

    const onBack = () => router.back();
    if (pathname === "/") {
      app.BackButton.hide();
    } else {
      app.BackButton.show();
      app.BackButton.onClick(onBack);
    }
    return () => app.BackButton.offClick(onBack);
  }, [pathname, router]);

  return null;
}
