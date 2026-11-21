-- MISS DOOD operations module. Apply after 009. Non-destructive.
BEGIN;
CREATE TABLE IF NOT EXISTS app_error_events (
 id bigserial PRIMARY KEY,
 scope text NOT NULL CHECK(length(scope) BETWEEN 1 AND 100),
 message text NOT NULL CHECK(length(message) <= 500),
 fingerprint text NOT NULL CHECK(length(fingerprint) <= 128),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_error_events_created_idx ON app_error_events(created_at DESC);
CREATE TABLE IF NOT EXISTS admin_notifications (
 id bigserial PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('system','order','inventory','content')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
 detail text NOT NULL DEFAULT '' CHECK(length(detail)<=500),
 href text NOT NULL DEFAULT '/admin' CHECK(length(href)<=300),
 dedupe_key text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notifications_recent_idx ON admin_notifications(created_at DESC);
CREATE TABLE IF NOT EXISTS admin_notification_reads (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 notification_id bigint NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
 read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,notification_id)
);
CREATE TABLE IF NOT EXISTS web_vitals (
 id bigserial PRIMARY KEY,
 metric text NOT NULL CHECK(metric IN ('LCP','INP','CLS','FCP','TTFB')),
 value double precision NOT NULL CHECK(value>=0 AND value<1000000),
 path text NOT NULL CHECK(length(path)<=200),
 device text NOT NULL CHECK(device IN ('mobile','desktop')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS web_vitals_metric_idx ON web_vitals(metric,device,created_at DESC);
COMMIT;

-- Event-driven notifications. These triggers do not change order/stock behavior.
CREATE OR REPLACE FUNCTION md_notify_new_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO admin_notifications(kind,title,detail,href,dedupe_key)
 VALUES ('order','سفارش جدید','سفارش جدید ثبت شد.','/admin/orders','order:'||NEW.id::text)
 ON CONFLICT (dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS md_order_notification ON orders;
CREATE TRIGGER md_order_notification AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION md_notify_new_order();
CREATE OR REPLACE FUNCTION md_notify_low_stock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.stock<=5 AND OLD.stock>5 THEN
   INSERT INTO admin_notifications(kind,title,detail,href,dedupe_key)
   VALUES ('inventory','هشدار موجودی کم',left(NEW.name,350),'/admin/inventory','stock:'||NEW.slug||':'||date_trunc('day',now())::date::text)
   ON CONFLICT (dedupe_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS md_stock_notification ON products;
CREATE TRIGGER md_stock_notification AFTER UPDATE OF stock ON products FOR EACH ROW EXECUTE FUNCTION md_notify_low_stock();

CREATE OR REPLACE FUNCTION md_notify_operational_error() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO admin_notifications(kind,title,detail,href,dedupe_key)
 VALUES ('system','خطای سمت سرور',left(NEW.scope,450),'/admin/operations',
 'error:'||NEW.fingerprint||':'||date_trunc('hour',NEW.created_at)::text)
 ON CONFLICT (dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS md_error_notification ON app_error_events;
CREATE TRIGGER md_error_notification AFTER INSERT ON app_error_events FOR EACH ROW EXECUTE FUNCTION md_notify_operational_error();
