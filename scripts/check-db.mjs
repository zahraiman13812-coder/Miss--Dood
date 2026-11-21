import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from .env.local");
  process.exit(1);
}
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
try {
  await client.connect();
  const connection = await client.query("SELECT current_database() AS database, current_user AS username");
  console.log(`Connected to ${connection.rows[0].database} as ${connection.rows[0].username}`);

  const checks = [
    ["users/products/orders", "db/001_init.sql", "to_regclass('public.users') IS NOT NULL AND to_regclass('public.products') IS NOT NULL AND to_regclass('public.orders') IS NOT NULL"],
    ["authentication limits", "db/002_safety.sql", "to_regclass('public.auth_rate_limits') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='idempotency_key')"],
    ["email OTP", "db/003_email_otp.sql", "to_regclass('public.email_otp_challenges') IS NOT NULL"],
    ["customer address book", "db/004_account_features.sql", "to_regclass('public.user_addresses') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone')"],
    ["delivery map", "db/005_delivery_map.sql", "to_regclass('public.delivery_config') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='shipping_method')"],
    ["admin CMS and media", "db/007_admin_cms.sql then db/008_admin_media.sql", "to_regclass('public.site_settings') IS NOT NULL AND to_regclass('public.admin_audit_log') IS NOT NULL AND to_regclass('public.admin_media') IS NOT NULL"],
    ["professional store", "db/009_professional_store.sql", "to_regclass('public.product_images') IS NOT NULL AND to_regclass('public.product_reviews') IS NOT NULL AND to_regclass('public.inventory_movements') IS NOT NULL AND to_regclass('public.order_events') IS NOT NULL AND to_regclass('public.admin_permissions') IS NOT NULL"],
  ];
  let missing = false;
  for (const [name, migration, expression] of checks) {
    const result = await client.query(`SELECT (${expression}) AS ready`);
    if (result.rows[0]?.ready === true) console.log(`OK: ${name}`);
    else { console.error(`MISSING: ${name} — run ${migration} after backup`); missing = true; }
  }
  if (missing) process.exitCode = 2;
  else console.log("Database schema OK (migrations 001–009).");
} catch (error) {
  console.error("PostgreSQL connection/schema check failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
