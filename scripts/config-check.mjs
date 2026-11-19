const required = ["DATABASE_URL", "RESEND_API_KEY", "EMAIL_FROM", "AUTH_OTP_SECRET"];
let errors = 0;
for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`Missing environment variable: ${key}`);
    errors++;
  }
}
if (process.env.AUTH_OTP_SECRET && process.env.AUTH_OTP_SECRET.length < 32) {
  console.error("AUTH_OTP_SECRET must have at least 32 characters");
  errors++;
}
if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    if (!(["postgresql:", "postgres:"].includes(parsed.protocol))) throw new Error("invalid protocol");
  } catch {
    console.error("DATABASE_URL must be a valid postgres:// or postgresql:// URL");
    errors++;
  }
}
if (process.env.EMAIL_FROM?.includes("onboarding@resend.dev")) {
  console.warn("Resend is in test-sender mode: delivery to arbitrary customer emails is not available until a sending domain is verified.");
}
if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_")) {
  console.warn("RESEND_API_KEY does not begin with the expected re_ prefix.");
}
if (errors) process.exitCode = 1;
else console.log("Required configuration present (no credentials printed). External service access not tested.");
