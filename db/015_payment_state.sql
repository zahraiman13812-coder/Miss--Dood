-- Prepare orders for a real payment gateway without ever faking confirmation.
-- Run once after 014_admin_permissions_backfill.sql.
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status,created_at DESC);
-- All historical orders remain unpaid/unverified until reconciled against real receipts.
COMMIT;
