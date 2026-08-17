import mysql from "mysql2/promise";
import { SetupError, missingEnv, missingEnvProblem } from "./setup";

declare global {
  // Reuse the pool across hot reloads in dev so we don't exhaust connections.
  var __vstorePool: mysql.Pool | undefined;
}

function createPool() {
  // Fail with a named list of variables rather than letting the driver dial
  // 127.0.0.1 as root and report a confusing access-denied error instead.
  const missing = missingEnv();
  if (missing.length) throw new SetupError(missingEnvProblem(missing));

  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

/**
 * Built on first query, not at import time, so a configuration problem surfaces
 * as a catchable error inside the page render instead of a module-load crash.
 */
let cached: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  cached ??= global.__vstorePool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    global.__vstorePool = cached;
  }
  return cached;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}

/** WordPress table prefix, e.g. `wp_`. */
export const P = process.env.DB_PREFIX ?? "wp_";
