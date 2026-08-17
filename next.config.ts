import type { NextConfig } from "next";

/** Allow images from both the primary uploads host and the fallback host. */
const imageHosts = [
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? "https://vstorecenter.com/wp-content/uploads",
  process.env.NEXT_PUBLIC_UPLOADS_FALLBACK_URL,
]
  .filter((value): value is string => Boolean(value))
  .map((value) => {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      pathname: `${url.pathname.replace(/\/$/, "")}/**`,
    };
  });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHosts,
  },
  // Telegram loads the mini app inside an iframe/webview.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
