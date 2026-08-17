import mysql from "mysql2/promise";

declare global {
  // Reuse the pool across hot reloads in dev so we don't exhaust connections.
  var __vstorePool: mysql.Pool | undefined;
}

function createPool() {
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

export const pool: mysql.Pool = global.__vstorePool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__vstorePool = pool;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** WordPress table prefix, e.g. `wp_`. */
export const P = process.env.DB_PREFIX ?? "wp_";
