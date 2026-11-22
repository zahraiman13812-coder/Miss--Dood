// Check the actual Gmail-based OTP configuration without logging secrets.
const required = ["DATABASE_URL", "AUTH_OTP_SECRET", "GMAIL_USER", "GMAIL_APP_PASSWORD"];
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
    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) throw new Error("invalid protocol");
  } catch {
    console.error("DATABASE_URL must be a valid postgres:// or postgresql:// URL");
    errors++;
  }
}
if (process.env.GMAIL_USER && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.GMAIL_USER.trim())) {
  console.error("GMAIL_USER must be an email address");
  errors++;
}
if (process.env.GAMIL_APP_PASSWORD && !process.env.GMAIL_APP_PASSWORD) {
  console.error("Typo: GAMIL_APP_PASSWORD is not recognized. Use GMAIL_APP_PASSWORD.");
  errors++;
}
const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
if (appPassword && appPassword.length !== 16) {
  console.warn("GMAIL_APP_PASSWORD is not 16 characters long after spaces are removed; check the App Password value.");
}
if (errors) process.exitCode = 1;
else console.log("Gmail OTP and database configuration present. Actual SMTP delivery and database connectivity not tested.");
