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
    ["operations and monitoring", "db/010_operations.sql", "to_regclass('public.app_error_events') IS NOT NULL AND to_regclass('public.admin_notifications') IS NOT NULL AND to_regclass('public.web_vitals') IS NOT NULL"],
    ["professional store", "db/009_professional_store.sql", "to_regclass('public.product_images') IS NOT NULL AND to_regclass('public.product_reviews') IS NOT NULL AND to_regclass('public.inventory_movements') IS NOT NULL AND to_regclass('public.order_events') IS NOT NULL AND to_regclass('public.admin_permissions') IS NOT NULL"],
    ["product archive", "db/011_product_archive.sql", "EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='deleted_at')"],
    ["cart snapshots and nationwide shipping", "db/012_cart_shipping.sql", "to_regclass('public.customer_cart_snapshots') IS NOT NULL AND to_regclass('public.national_shipping_policy') IS NOT NULL"],
    ["city delivery method options", "db/013_delivery_options.sql", "to_regclass('public.delivery_rate_options') IS NOT NULL"],

  ];
  let missing = false;
  for (const [name, migration, expression] of checks) {
    try {
      const result = await client.query(`SELECT (${expression}) AS ready`);
      if (result.rows[0]?.ready === true) console.log(`OK: ${name}`);
      else { console.error(`MISSING: ${name} — verify ${migration} after backup`); missing = true; }
    } catch (error) {
      console.error(`MISSING/ERROR: ${name} — verify ${migration}: ${error instanceof Error ? error.message : "unknown"}`);
      missing = true;
    }
  }
  // Migration 014 is a data backfill. The table may already exist after 009,
  // so checking only its presence would incorrectly mark 014 as applied.
  if (await client.query("SELECT to_regclass('public.admin_permissions') IS NOT NULL AS ready").then(r => r.rows[0]?.ready)) {
    const owners = await client.query(`SELECT count(*)::int AS count
      FROM users u LEFT JOIN admin_permissions ap ON ap.user_id=u.id
      WHERE u.role='admin' AND ap.user_id IS NULL`);
    if (owners.rows[0]?.count) {
      console.error(`MISSING: ${owners.rows[0].count} admin user(s) have no permission record; review db/014_admin_permissions_backfill.sql`);
      missing = true;
    } else console.log("OK: admin permission backfill (migration 014)");
  } else {
    console.error("MISSING: admin_permissions for migration 014");
    missing = true;
  }
  if (missing) process.exitCode = 2;
  else console.log("Database core schema checks passed (001–014); exact migration history and data integrity require separate verification.");
} catch (error) {
  console.error("PostgreSQL connection/schema check failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
