-- MISS DOOD: performance indexes for growing catalogs, orders and support inboxes.
-- Backup production first. Apply after 001..005; safe to re-run.
CREATE INDEX IF NOT EXISTS products_active_category_updated_idx
  ON products(category, updated_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_active_brand_idx
  ON products(brand) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_active_stock_idx
  ON products(stock) WHERE active = true;
CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
  ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx
  ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_ticket_created_idx
  ON support_messages(ticket_id, created_at, id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_slug_idx ON order_items(product_slug);
