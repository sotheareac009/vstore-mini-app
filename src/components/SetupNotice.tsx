import { DEBUG_ENV_FLAG, envStatus, type SetupProblem } from "@/lib/setup";

/**
 * Shown in place of the storefront when the app can't reach its data.
 * Shoppers see a plain "unavailable" message; developers see the diagnosis
 * once diagnostics are enabled (automatic in dev, SHOW_SETUP_ERRORS=1 in prod).
 */
export default function SetupNotice({ problem }: { problem: SetupProblem }) {
  if (!problem.detailed) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-[26px]">
          🛠️
        </div>
        <h1 className="text-[17px] font-semibold">Store temporarily unavailable</h1>
        <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-tg-hint">
          We&apos;re having trouble loading products right now. Please try again in a few minutes.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tg-danger/10 text-[20px]">
          ⚠️
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-danger">
            Setup required
          </p>
          <h1 className="mt-0.5 text-[20px] font-bold leading-[1.25]">{problem.title}</h1>
        </div>
      </div>

      <p className="text-[14px] leading-[1.65] text-tg-text/85">{problem.summary}</p>

      {problem.variables.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
            Environment variables to check
          </h2>
          <div className="flex flex-wrap gap-2">
            {problem.variables.map((name) => (
              <code
                key={name}
                className="numeric rounded-full border border-hairline bg-surface px-3 py-1.5 text-[12px] font-medium shadow-sm"
              >
                {name}
              </code>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
          How to fix
        </h2>
        <ol className="space-y-2.5 rounded-card border border-hairline bg-surface p-4 shadow-sm">
          {problem.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-[14px] leading-[1.6]">
              <span className="numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-ink">
                {i + 1}
              </span>
              <span className="text-tg-text/85">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
          Current environment
        </h2>
        <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
          {envStatus().map(({ key, set }) => (
            <li key={key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <code className="numeric text-[12.5px]">{key}</code>
              <span
                className={`text-[11px] font-semibold ${set ? "text-brand-ink" : "text-tg-danger"}`}
              >
                {set ? "set" : "not set"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] leading-[1.55] text-tg-hint">
          Values are never shown here — only whether each variable has one.
        </p>
      </section>

      {problem.raw && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
            Original error
          </h2>
          <pre className="overflow-x-auto rounded-card border border-hairline bg-sunken p-4 text-[12px] leading-[1.55]">
            {problem.raw}
          </pre>
        </section>
      )}

      <p className="mt-6 text-[11.5px] leading-[1.55] text-tg-hint">
        This screen is visible because <code className="numeric">{DEBUG_ENV_FLAG}=1</code> is set or
        the app is running in development. Unset it to show shoppers a generic message instead.
      </p>
    </main>
  );
}
