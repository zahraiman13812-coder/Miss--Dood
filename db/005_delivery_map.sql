-- MISS DOOD — run AFTER db/004_account_features.sql. Backup database first.
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '';
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS building text NOT NULL DEFAULT '';
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT '';
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS preferred_shipping_method text NOT NULL DEFAULT 'post';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_province text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS building text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'post';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_addresses_coords_pair') THEN
    ALTER TABLE user_addresses ADD CONSTRAINT user_addresses_coords_pair CHECK (
      (latitude IS NULL AND longitude IS NULL) OR
      (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='preferred_shipping_method_check') THEN
    ALTER TABLE user_addresses ADD CONSTRAINT preferred_shipping_method_check CHECK (preferred_shipping_method IN ('post','express','pickup'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_shipping_method_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_shipping_method_check CHECK (shipping_method IN ('post','express','pickup'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_coords_pair') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_coords_pair CHECK (
      (latitude IS NULL AND longitude IS NULL) OR
      (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS delivery_config (
  method text PRIMARY KEY CHECK (method IN ('express')),
  fee bigint NOT NULL CHECK (fee >= 0),
  active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Express disabled until admin sets fee in /admin.
INSERT INTO delivery_config (method,fee,active) VALUES ('express',0,false)
ON CONFLICT (method) DO NOTHING;
