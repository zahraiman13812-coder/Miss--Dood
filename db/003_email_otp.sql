-- Email one-time-password challenges for Resend-based sign-in.
-- Run once in pgAdmin Query Tool after 001_init.sql and 002_safety.sql.
CREATE TABLE IF NOT EXISTS email_otp_challenges (
  email text PRIMARY KEY,
  purpose text NOT NULL CHECK (purpose IN ('login','register')),
  full_name text NOT NULL DEFAULT '',
  code_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_window_started_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 0 CHECK (send_count >= 0),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_otp_expiry_idx ON email_otp_challenges(expires_at);
