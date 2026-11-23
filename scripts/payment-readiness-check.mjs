import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get = (path)=>readFileSync(path,'utf8');
const sql=get('db/015_payment_state.sql');
assert.match(sql,/payment_status text NOT NULL DEFAULT 'unpaid'/);
const api=get('src/app/api/orders/route.ts');
assert.match(api,/paymentStatus:"unpaid"/);
assert.doesNotMatch(api,/paymentStatus:"paid"/);
assert.match(get('src/app/(store)/checkout/page.tsx'),/ثبت سفارش پرداخت‌نشده/);
for(const file of ['src/app/(store)/admin/orders/page.tsx','src/app/(store)/admin/orders/[id]/page.tsx','src/app/(store)/account/invoices/[id]/page.tsx','src/app/(store)/orders/page.tsx']){assert.match(get(file),/payment_status/,file)}
console.log('Payment readiness: unpaid-by-default, no fake gateway confirmation, status visible.');
