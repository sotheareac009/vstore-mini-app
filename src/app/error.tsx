"use client";

import { useEffect } from "react";

/**
 * Safety net for render failures the pages don't catch themselves.
 * React strips the message from production Server Component errors (that's the
 * "Minified React error #441" in the console), so the digest below is the only
 * handle for finding the real stack trace in the Vercel runtime logs.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-[26px]">
        ⚠️
      </div>
      <h1 className="text-[17px] font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-tg-hint">
        We couldn&apos;t load this page. Please try again.
      </p>

      {error.digest && (
        <p className="numeric mt-3 text-[11px] text-tg-hint">Reference: {error.digest}</p>
      )}

      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-brand-fg shadow-brand transition active:scale-95"
      >
        Try again
      </button>
    </main>
  );
}
