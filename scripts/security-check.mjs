import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (path) => readFileSync(path, "utf8");
const otp = source("src/app/api/auth/otp/route.ts");
const password = source("src/app/api/auth/route.ts");
const orders = source("src/app/api/orders/route.ts");
const admin = source("src/app/api/admin/route.ts");
const sessions = source("src/lib/session.ts");
assert.match(otp, /consumeAuthAttempt/, "OTP endpoints require shared rate limiting");
assert.match(otp, /OTP_COOLDOWN/, "OTP resend needs a cooldown");
assert.match(otp, /timingSafeEqual/, "OTP hash comparisons must be constant-time");
assert.match(password, /EMAIL_VERIFICATION_REQUIRED/, "Unverified public password signup must be disabled");
assert.match(password, /consumeAuthAttempt/, "Legacy password login must remain throttled");
assert.match(orders, /FOR UPDATE/, "Orders must reserve stock with a transaction lock");
assert.match(orders, /idempotency-key/, "Orders require idempotency keys");
assert.match(admin, /currentUser\(\)/, "Admin endpoints must authenticate users");
assert.match(admin, /role\s*!==\s*["']admin["']/, "Admin endpoints must enforce admin role");
assert.match(sessions, /httpOnly\s*:\s*true/, "Session cookies must be HttpOnly");
console.log("Security source checks passed");

// Regression checks for transactional idempotency, address defaults and failed emails.
assert.match(orders, /pg_advisory_xact_lock/, "Concurrent retries need an advisory transaction lock");
assert.match(otp, /code_hash=\$2 AND consumed_at IS NULL/, "Failed sends must only invalidate their own challenge");
const addresses = source("src/app/api/account/addresses/route.ts");
assert.match(addresses, /keepDefault/, "Editing addresses must preserve a default address");
