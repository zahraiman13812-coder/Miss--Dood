-- Run after db/012_cart_shipping.sql and after a verified backup.
BEGIN;
-- Keep old order history and address preferences intact while allowing custom keys.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_shipping_method_check CHECK (shipping_method ~ '^[a-z][a-z0-9_]{1,31}$');
CREATE TABLE IF NOT EXISTS delivery_rate_options (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  province text NOT NULL CHECK (char_length(province) BETWEEN 1 AND 80),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  method_key text NOT NULL CHECK (method_key ~ '^[a-z][a-z0-9_]{1,31}$'),
  method_label text NOT NULL CHECK (char_length(method_label) BETWEEN 2 AND 100),
  fee bigint NOT NULL CHECK (fee BETWEEN 0 AND 100000000),
  days text NOT NULL CHECK (char_length(days) BETWEEN 2 AND 100),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(province,city,method_key)
);
CREATE INDEX IF NOT EXISTS delivery_rate_options_lookup ON delivery_rate_options (province,city,active);
COMMIT;
