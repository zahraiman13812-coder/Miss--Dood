-- MISS DOOD migration 014: safe admin permission bootstrap.
-- IMPORTANT: take a Neon backup. Run AFTER 009 and BEFORE publishing the
-- accompanying fail-closed src/lib/admin-access.ts.
BEGIN;
INSERT INTO admin_permissions(user_id,scope)
SELECT id,'owner' FROM users WHERE role='admin'
ON CONFLICT (user_id) DO NOTHING;
-- Do not auto-promote newly created admins in application code.
-- All pre-existing admin accounts lacking a row receive explicit owner scope
-- for backward compatibility. Review these assignments in /admin/team afterwards.
COMMIT;
