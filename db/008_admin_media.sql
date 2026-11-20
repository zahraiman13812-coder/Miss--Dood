-- Run after 007_admin_cms.sql. Back up your Neon database first.
BEGIN;
CREATE TABLE IF NOT EXISTS admin_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 filename text NOT NULL,
 mime_type text NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp','image/gif')),
 bytes bytea NOT NULL,
 byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 2097152),
 uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_media_created_idx ON admin_media(created_at DESC);
COMMIT;
