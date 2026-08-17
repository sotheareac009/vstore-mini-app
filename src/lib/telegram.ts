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
  /** Bot API version the host client implements, e.g. "6.0" or "7.10". */
  version: string;
  /** "ios" | "android" | "tdesktop" | … or "unknown" outside Telegram. */
  platform: string;
  /** Present since 6.0, but feature-detected anyway — see `supports`. */
  isVersionAtLeast?: (version: string) => boolean;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  /** Requires Bot API 6.1 — guard with `supports("6.1")` before touching. */
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

/**
 * Whether we're really running inside a Telegram client.
 *
 * `tg()` is not a reliable test: telegram-web-app.js assigns
 * window.Telegram.WebApp as soon as it loads, in any browser. Outside Telegram
 * it reports platform "unknown", and its native chrome (MainButton, BackButton)
 * draws nothing — so UI that defers to those must check this instead, or
 * desktop-browser users are left with no button at all.
 */
export function inTelegram(): boolean {
  const app = tg();
  return Boolean(app && app.platform && app.platform !== "unknown");
}

/**
 * Whether the host client implements at least `min` of the Bot API.
 *
 * Calling a newer method on an older client isn't an error — the SDK just
 * logs "[Telegram.WebApp] X is not supported in version 6.0" and does
 * nothing — so anything above 6.0 has to be gated to keep the console clean
 * and to let us fall back to in-app UI.
 */
export function supports(min: string): boolean {
  const app = tg();
  if (!app) return false;
  if (typeof app.isVersionAtLeast === "function") return app.isVersionAtLeast(min);

  // Older clients without the helper: compare the dotted version ourselves.
  const parse = (v: string) => v.split(".").map((n) => Number(n) || 0);
  const [have, want] = [parse(app.version ?? "6.0"), parse(min)];
  for (let i = 0; i < Math.max(have.length, want.length); i++) {
    const diff = (have[i] ?? 0) - (want[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

/**
 * Opens a t.me link. Inside Telegram this closes the mini app and lands the
 * user in the conversation; in a browser a same-tab navigation is used because
 * a popup opened after an await is usually blocked.
 */
export function openChat(link: string) {
  const app = tg();
  if (app && inTelegram() && typeof app.openTelegramLink === "function") {
    app.openTelegramLink(link);
    return;
  }
  window.location.href = link;
}

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  // HapticFeedback landed in 6.1 alongside BackButton.
  if (!supports("6.1")) return;
  tg()?.HapticFeedback?.impactOccurred(style);
}
