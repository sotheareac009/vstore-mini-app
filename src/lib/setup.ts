import "server-only";

/**
 * Turns "the database blew up" into something a developer can act on.
 *
 * Server Component renders that throw show up in production as a bare
 * "Minified React error #441" — React strips the message so it can't leak
 * secrets. Almost every one of those in this app is really a missing or wrong
 * environment variable, so we catch the failure, diagnose it here, and render
 * a setup screen instead of crashing the tree.
 */

/** Env vars the app cannot run without. */
const REQUIRED = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;

/** Set on the deployment to reveal diagnostics on a public URL. */
const DEBUG_FLAG = "SHOW_SETUP_ERRORS";

export type SetupProblem = {
  /** Short headline for the notice. */
  title: string;
  /** What went wrong, in one or two sentences. */
  summary: string;
  /** Env vars to add or correct. */
  variables: string[];
  /** Ordered things to try. */
  steps: string[];
  /** Raw error text — only ever shown when `detailed` is true. */
  raw?: string;
  /** Whether the viewer is allowed to see `summary`/`variables`/`steps`/`raw`. */
  detailed: boolean;
};

export class SetupError extends Error {
  readonly problem: SetupProblem;

  constructor(problem: SetupProblem) {
    super(problem.title);
    this.name = "SetupError";
    this.problem = problem;
  }
}

/**
 * Diagnostics are safe to show locally, but on a public deployment they'd
 * expose the DB host and username, so there they're opt-in via SHOW_SETUP_ERRORS=1.
 */
export function showsDetail(): boolean {
  return process.env.NODE_ENV !== "production" || process.env[DEBUG_FLAG] === "1";
}

/** Env vars that are absent or empty. */
export function missingEnv(): string[] {
  return REQUIRED.filter((key) => !process.env[key]?.trim());
}

export function missingEnvProblem(missing: string[]): SetupProblem {
  return {
    title: "Missing configuration",
    summary:
      `The app has no database credentials. ${missing.length} required environment ` +
      `${missing.length === 1 ? "variable is" : "variables are"} not set on this deployment.`,
    variables: missing,
    steps: [
      "Open Vercel → your project → Settings → Environment Variables.",
      `Add the ${missing.length === 1 ? "variable" : "variables"} above for the Production environment.`,
      "Copy the values from your WordPress host's wp-config.php (DB_NAME, DB_USER, DB_PASSWORD) and hPanel → Databases for the host.",
      "Redeploy — env var changes only take effect on a new deployment.",
    ],
    detailed: showsDetail(),
  };
}

/** MySQL driver errors carry a string `code` that says exactly what's wrong. */
type DriverError = Error & { code?: string; errno?: number };

/**
 * Map a connection/query failure onto the env var that most likely caused it.
 * Every branch names variables rather than echoing values, so a password never
 * reaches the page even with diagnostics turned on.
 */
export function diagnose(error: unknown): SetupProblem {
  if (error instanceof SetupError) return error.problem;

  const missing = missingEnv();
  if (missing.length) return missingEnvProblem(missing);

  const err = error as DriverError;
  const code = err?.code ?? "";
  const detailed = showsDetail();
  const host = process.env.DB_HOST ?? "(unset)";
  const base = { raw: err?.message, detailed };

  switch (code) {
    case "ER_ACCESS_DENIED_ERROR":
      return {
        ...base,
        title: "Database rejected the login",
        summary:
          `The server at ${host} is reachable, but it refused the username or password. ` +
          "These are usually still set to local development values.",
        variables: ["DB_USER", "DB_PASSWORD"],
        steps: [
          "Check the credentials in your host's wp-config.php — DB_USER and DB_PASSWORD there are the ones WordPress itself uses.",
          "On shared hosting the username is rarely 'root'; it normally looks like u123456789_name.",
          "Reset the password in hPanel → Databases if you don't have it, then update it in Vercel.",
          "Update the variables in Vercel and redeploy.",
        ],
      };

    case "ER_BAD_DB_ERROR":
      return {
        ...base,
        title: "Database not found",
        summary: `Login succeeded on ${host}, but no database named "${process.env.DB_NAME}" exists there.`,
        variables: ["DB_NAME"],
        steps: [
          "Look up the exact database name in hPanel → Databases, or DB_NAME in wp-config.php.",
          "Set DB_NAME in Vercel to that value and redeploy.",
        ],
      };

    case "ER_NO_SUCH_TABLE":
      return {
        ...base,
        title: "WordPress tables not found",
        summary:
          `Connected to "${process.env.DB_NAME}", but the expected tables aren't there. ` +
          `The table prefix is currently "${process.env.DB_PREFIX ?? "wp_"}".`,
        variables: ["DB_PREFIX", "DB_NAME"],
        steps: [
          "Check $table_prefix in your WordPress wp-config.php — it is often not the default wp_.",
          "Set DB_PREFIX in Vercel to match, including the trailing underscore.",
          "If the prefix is right, confirm DB_NAME points at the WordPress database and not another one.",
        ],
      };

    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "ENOTFOUND":
    case "EHOSTUNREACH":
    case "PROTOCOL_CONNECTION_LOST":
      return {
        ...base,
        title: "Cannot reach the database",
        summary:
          code === "ENOTFOUND"
            ? `The hostname "${host}" does not resolve.`
            : `Nothing answered on ${host}:${process.env.DB_PORT ?? 3306} before the connection timed out.`,
        variables: ["DB_HOST", "DB_PORT"],
        steps: [
          "127.0.0.1 and localhost never work on Vercel — they point at the serverless function itself, not your database.",
          "Use the public IP or hostname of your database server.",
          "Enable Remote MySQL in hPanel → Databases → Remote MySQL. Vercel's IPs are dynamic, so the app needs the % (any host) wildcard.",
          "Confirm the port is open: nc -z <host> 3306",
        ],
      };

    default:
      return {
        ...base,
        title: "Database error",
        summary: `The query failed${code ? ` with ${code}` : ""}.`,
        variables: [...REQUIRED, "DB_PORT", "DB_PREFIX"],
        steps: [
          "Check the deployment's Runtime Logs in Vercel for the full stack trace.",
          "Verify each database variable against wp-config.php on your host.",
        ],
      };
  }
}

/** Which of the required vars are currently populated — never their values. */
export function envStatus(): { key: string; set: boolean }[] {
  return [
    ...REQUIRED,
    "DB_PORT",
    "DB_PREFIX",
    "NEXT_PUBLIC_UPLOADS_BASE_URL",
    "WC_STORE_URL",
    "WC_CONSUMER_KEY",
    "WC_CONSUMER_SECRET",
    "NEXT_PUBLIC_TELEGRAM_SHOP",
    "NEXT_PUBLIC_STORE_URL",
  ].map((key) => ({
    key,
    set: Boolean(process.env[key]?.trim()),
  }));
}

export const DEBUG_ENV_FLAG = DEBUG_FLAG;
