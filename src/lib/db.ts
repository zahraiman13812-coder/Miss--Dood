import "server-only";
import { Pool, type PoolClient } from "pg";

const globalPool = globalThis as typeof globalThis & { __missDoodPool?: Pool };
export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  return globalPool.__missDoodPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    // Vercel functions are short-lived; keep a small pool to avoid exhausting hosted PostgreSQL connections.
    max: Number(process.env.PG_POOL_MAX ?? (process.env.VERCEL ? 3 : 10)),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try { await client.query("BEGIN"); const result = await work(client); await client.query("COMMIT"); return result; }
  catch (err) { await client.query("ROLLBACK"); throw err; }
  finally { client.release(); }
}
