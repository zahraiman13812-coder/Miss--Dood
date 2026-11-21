-- Apply after 010_operations.sql. Back up Neon before applying.
-- Soft deletion preserves orders, favorites, inventory movements, and review history.
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS products_live_updated_idx ON products(updated_at DESC,slug) WHERE deleted_at IS NULL;
COMMIT;
