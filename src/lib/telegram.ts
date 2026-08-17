"use client";

/** Minimal typing of the bits of the Telegram WebApp SDK this app uses. */
export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string };
  };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    /** Not present on older Telegram clients — always feature-detect. */
    setParams?: (params: { color?: string; text_color?: string; text?: string }) => void;
  };
  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function tg(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  tg()?.HapticFeedback?.impactOccurred(style);
}
