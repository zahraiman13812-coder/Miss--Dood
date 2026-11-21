-- MISS DOOD professional commerce features. Apply after migration 008, once.
BEGIN;
CREATE TABLE IF NOT EXISTS product_images (
 id bigserial PRIMARY KEY,
 product_slug text NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
 src text NOT NULL CHECK(length(src) BETWEEN 1 AND 500),
 alt text NOT NULL DEFAULT '',
 sort_order integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(product_slug,src)
);
CREATE INDEX IF NOT EXISTS product_images_order_idx ON product_images(product_slug,sort_order,id);
CREATE TABLE IF NOT EXISTS product_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_slug text NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
 body text NOT NULL CHECK(length(body) BETWEEN 10 AND 1500),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz,
 UNIQUE(product_slug,user_id)
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON product_reviews(product_slug,state,created_at DESC);
CREATE TABLE IF NOT EXISTS order_events (
 id bigserial PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 from_status text, to_status text NOT NULL,
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events(order_id,created_at,id);
CREATE TABLE IF NOT EXISTS inventory_movements (
 id bigserial PRIMARY KEY,
 product_slug text NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 quantity_delta integer NOT NULL CHECK(quantity_delta <> 0),
 before_stock integer NOT NULL CHECK(before_stock >= 0),
 after_stock integer NOT NULL CHECK(after_stock >= 0),
 reason text NOT NULL,
 order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_product_idx ON inventory_movements(product_slug,created_at DESC);
CREATE TABLE IF NOT EXISTS admin_permissions (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 scope text NOT NULL CHECK(scope IN ('owner','manager','catalog','warehouse','orders','support')),
 assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Existing admins retain full rights (owner fallback) until explicitly scoped.
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin (to_tsvector('simple', name || ' ' || description || ' ' || brand));
INSERT INTO product_images(product_slug,src,alt,sort_order)
 SELECT slug,image,name,0 FROM products WHERE image<>'' ON CONFLICT DO NOTHING;
INSERT INTO order_events(order_id,to_status,note,created_at)
 SELECT o.id,o.status,'وضعیت اولیه',o.created_at FROM orders o
 WHERE NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id=o.id);
COMMIT;
