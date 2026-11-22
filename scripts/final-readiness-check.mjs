import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/lib/seo.ts", "src/app/robots.ts", "src/app/sitemap.ts",
  "src/app/api/auth/otp/route.ts", "src/app/api/orders/route.ts",
  "src/app/api/products/[slug]/reviews/route.ts", "src/lib/admin-access.ts",
  "db/013_delivery_options.sql", "db/014_admin_permissions_backfill.sql",
];
for (const path of required) assert.ok(existsSync(path), `Required file missing: ${path}`);
const read = (path) => readFileSync(path, "utf8");
assert.match(read("src/lib/admin-access.ts"), /: null;/, "Unknown admin scopes must fail closed");
assert.match(read("src/app/api/orders/route.ts"), /deleted_at IS NULL/, "Archived products must not be ordered");
assert.match(read("src/app/api/orders/preview/route.ts"), /deleted_at IS NULL/, "Preview must reject archived products");
assert.match(read("src/app/api/products/[slug]/reviews/route.ts"), /state='pending'/, "Reviews must start pending");
assert.match(read("src/app/api/products/[slug]/reviews/route.ts"), /consumeAuthAttempt/, "Review submits must be throttled");
const cityFile = "public/data/iran-cities.json";
if (existsSync(cityFile)) {
  const regions = JSON.parse(read(cityFile));
  assert.ok(Array.isArray(regions) && regions.length === 31, "City file must have 31 provinces");
  for (const region of regions) assert.ok(region.province && Array.isArray(region.cities) && region.cities.length > 0, `Missing cities: ${region.province}`);
  console.log(`Iran cities: ${regions.reduce((n, r) => n + r.cities.length, 0)} entries across 31 provinces`);
} else console.warn("WARNING: Full Iran cities file missing; run node scripts/sync-iran-cities.mjs");
console.log("Source readiness checks passed. Real database, browser, OTP, and SEO/Search Console checks remain manual.");
