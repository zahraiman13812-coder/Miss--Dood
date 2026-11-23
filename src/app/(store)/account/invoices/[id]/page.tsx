import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import PrintButton from "@/features/account/PrintButton";
import OrderTimeline from "@/features/account/OrderTimeline";

type Order = {
  id: string; created_at: string; status: string; recipient_name: string;
  recipient_phone: string; shipping_city: string; shipping_address: string;
  subtotal: number; shipping_fee: number; total: number; note: string | null; postal_code:string; shipping_province:string; building:string; unit:string; shipping_method:string; latitude:number|null; longitude:number|null; payment_status:string;
};
type Item = { product_name: string; quantity: number; unit_price: number; amount: number };
const price = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;
const statuses: Record<string, string> = {
  received: "دریافت شده", processing: "در حال پردازش", shipped: "ارسال شده",
  delivered: "تحویل شده", cancelled: "لغو شده",
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const orderResult = await db().query<Order>(`
    SELECT id,created_at,status,recipient_name,recipient_phone,shipping_city,shipping_address,
           subtotal::float8 AS subtotal,shipping_fee::float8 AS shipping_fee,total::float8 AS total,note,postal_code,shipping_province,building,unit,shipping_method,latitude,longitude,payment_status
    FROM orders WHERE id=$1 AND user_id=$2`, [id, user.id]);
  const order = orderResult.rows[0];
  if (!order) notFound();
  const lines = await db().query<Item>(`
    SELECT product_name,quantity,unit_price::float8 AS unit_price,amount::float8 AS amount
    FROM order_items WHERE order_id=$1 ORDER BY id`, [order.id]);

  return <main className="mx-auto max-w-4xl px-4 py-8 text-[#eee4cd] sm:px-8 print:max-w-none print:bg-white print:p-0 print:text-black">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href="/account?tab=orders" className="text-sm font-bold text-[#e7c783]">بازگشت به حساب کاربری</Link>
      <PrintButton />
    </div>
    <OrderTimeline orderId={order.id}/><article className="rounded-3xl border border-[#967741]/60 bg-[#13110d] p-5 shadow-xl sm:p-9 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[#987b46]/40 pb-6 print:border-gray-300">
        <div><p className="text-xs font-bold tracking-[.3em] text-[#d5b26e] print:text-black">MISS DOOD</p>
          <h1 className="mt-2 text-2xl font-black">صورتحساب سفارش</h1>
          <p className="mt-2 text-xs text-[#b9a987] print:text-gray-600">این سند خلاصه سفارش است و رسید پرداخت یا فاکتور رسمی مالیاتی نیست.</p>
        </div>
        <div className="text-sm leading-8"><p>شناسه: <bdi dir="ltr">{order.id}</bdi></p>
          <p>تاریخ: {new Date(order.created_at).toLocaleDateString("fa-IR")}</p>
          <p>وضعیت سفارش: {statuses[order.status] ?? order.status}</p><p>وضعیت پرداخت: <strong>{order.payment_status==="paid"?"تأییدشده":order.payment_status==="refunded"?"بازگشت وجه":"پرداخت‌نشده / تأییدنشده"}</strong></p></div>
      </header>
      <section className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
        <div><h2 className="mb-2 font-black">مشخصات خریدار</h2><p>{user.full_name || user.email}</p><p dir="ltr" className="text-right sm:text-right">{user.email}</p></div>
        <div><h2 className="mb-2 font-black">تحویل‌گیرنده</h2><p>{order.recipient_name} — {order.recipient_phone}</p>
          <p>{order.shipping_province}، {order.shipping_city}، {order.shipping_address} {order.building?`، پلاک ${order.building}`:""} {order.unit?`، واحد ${order.unit}`:""}</p>
          <p>روش تحویل: {({pickup:"حضوری",express:"اکسپرس تهران",post:"پست"} as Record<string,string>)[order.shipping_method]??order.shipping_method}</p>
          {order.postal_code&&<p>کد پستی: {order.postal_code}</p>}
          {order.latitude!==null&&order.longitude!==null&&<p><a className="text-[#ecc680] underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}>نمایش موقعیت روی نقشه</a></p>}</div>
      </section>
      <div className="overflow-x-auto rounded-xl border border-[#967741]/40 print:border-gray-300">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead className="bg-[#352b1a] text-[#f6dfae] print:bg-gray-100 print:text-black"><tr>
            <th className="px-4 py-3 text-right">کالا</th><th className="px-3 py-3 text-center">تعداد</th>
            <th className="px-3 py-3 text-left">قیمت واحد</th><th className="px-4 py-3 text-left">جمع</th>
          </tr></thead>
          <tbody>{lines.rows.map((line, index) => <tr key={index} className="border-t border-[#967741]/30 print:border-gray-200">
            <td className="px-4 py-3">{line.product_name}</td><td className="px-3 py-3 text-center">{line.quantity.toLocaleString("fa-IR")}</td>
            <td className="px-3 py-3 text-left">{price(line.unit_price)}</td><td className="px-4 py-3 text-left">{price(line.amount)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="mt-6 ms-auto max-w-sm space-y-3 text-sm">
        <div className="flex justify-between"><span>جمع کالاها</span><span>{price(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>هزینه ارسال</span><span>{price(order.shipping_fee)}</span></div>
        <div className="flex justify-between border-t border-[#967741]/50 pt-3 text-lg font-black print:border-gray-300"><span>مبلغ کل</span><span>{price(order.total)}</span></div>
      </div>
      {order.note && <p className="mt-6 border-t border-[#967741]/30 pt-4 text-sm">یادداشت سفارش: {order.note}</p>}
      <p className="mt-8 text-xs leading-7 text-[#b9a987] print:text-gray-600">پرداخت فقط با تأیید معتبر سرویس درگاه قابل ثبت است. تا زمان اتصال درگاه، این صورتحساب رسید پرداخت محسوب نمی‌شود.</p>
    </article>
  </main>;
}
