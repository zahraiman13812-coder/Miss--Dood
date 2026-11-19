-- MISS DOOD: customer address book and profile contact fields.
-- PostgreSQL 15+; safe to run repeatedly in pgAdmin Query Tool.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  recipient_name text NOT NULL CHECK (char_length(recipient_name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 25),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  address text NOT NULL CHECK (char_length(address) BETWEEN 6 AND 1000),
  postal_code text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_addresses_user_idx ON user_addresses(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default_idx ON user_addresses(user_id) WHERE is_default;
