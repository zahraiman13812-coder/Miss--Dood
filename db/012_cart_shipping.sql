-- Apply ONLY after migrations 001-011. Backup database first.
BEGIN;
CREATE TABLE IF NOT EXISTS national_shipping_policy (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),
 fee bigint NOT NULL DEFAULT 0 CHECK(fee >= 0 AND fee <= 100000000),
 days text NOT NULL DEFAULT 'زمان تحویل پس از تأیید',
 active boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO national_shipping_policy(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS customer_cart_snapshots (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 items jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(items)='object'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_customer_cart_snapshots_updated ON customer_cart_snapshots(updated_at DESC);
COMMIT;
