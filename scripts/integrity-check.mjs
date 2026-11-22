import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const catalog = read("src/app/api/catalog/route.ts");
assert.match(catalog, /FROM products WHERE active=true AND deleted_at IS NULL/, "Archived products must not appear in public catalog");
const notify = read("src/app/api/admin/notifications/route.ts");
assert.match(notify, /active=true AND deleted_at IS NULL AND stock<=5/, "Archived products must not trigger low stock alerts");
const checkout = read("src/app/(store)/checkout/page.tsx");
assert.match(checkout, /street:found\.address/, "A saved address must be immediately usable");
assert.match(checkout, /const shippingAddressText =/, "Avoid duplicating a saved full address");
assert.match(checkout, /shippingProvince:method==="pickup"\?"تهران":recipient\.province/, "Order preview should use the same pickup province as real checkout");
const db = read("scripts/check-db.mjs");
for (const migration of ["011_product_archive", "012_cart_shipping", "013_delivery_options", "014_admin_permissions_backfill"]) {
  assert.ok(db.includes(migration), `Missing DB readiness check: ${migration}`);
}
const mail = read("src/lib/otp-mailer.ts");
const otp = read("src/app/api/auth/otp/route.ts");
assert.match(mail, /GMAIL_APP_PASSWORD/, "Gmail mailer requires correct app-password variable");
assert.match(otp, /await sendOtpEmail\(email, code\)/, "OTP must call current mailer");
assert.match(read("scripts/config-check.mjs"), /GAMIL_APP_PASSWORD/, "Configuration check should diagnose common variable-name typo");
assert.ok(existsSync("public/data/iran-cities.json"), "Full Iran city dataset missing");
assert.match(read(".gitignore"), /\.env\.\*/, "Ignore real environment secrets in Git");
console.log("Integrity source checks passed. Real Neon, SMTP, shipping, browser, and backup/restore tests are still required.");
