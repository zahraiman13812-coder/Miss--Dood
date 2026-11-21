import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
for(const p of ["db/010_operations.sql","scripts/backup-db.mjs","scripts/test-restore.mjs","src/app/api/admin/operations/route.ts","src/app/api/admin/notifications/route.ts","src/app/api/admin/quick-search/route.ts"]){assert.ok(existsSync(p),`Missing ${p}`)}
assert.match(readFileSync("scripts/test-restore.mjs","utf8"),/REFUSED: restore target is the main database/);
assert.match(readFileSync("src/app/api/admin/operations/route.ts","utf8"),/adminCan/);
console.log("Operations integration source checks passed");
