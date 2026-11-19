import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
await client.connect();
try {
  const sessions = await client.query("DELETE FROM sessions WHERE expires_at <= now()");
  const otp = await client.query("DELETE FROM email_otp_challenges WHERE expires_at < now()-interval '24 hours'");
  const limits = await client.query(`DELETE FROM auth_rate_limits
    WHERE window_start < now()-interval '48 hours'
      AND (blocked_until IS NULL OR blocked_until < now())`);
  console.log("expired sessions removed:", sessions.rowCount);
  console.log("expired OTP challenges removed:", otp.rowCount);
  console.log("stale rate-limit buckets removed:", limits.rowCount);
} finally {
  await client.end();
}
