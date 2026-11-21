import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { adminCan } from "@/lib/admin-access";
import { db } from "@/lib/db";
import PrintButton from "@/features/account/PrintButton";

export const runtime = "nodejs";

type Order = {
  id: string; created_at: string; status: string; recipient_name: string;
  recipient_phone: string; shipping_city: string; shipping_address: string;
  shipping_province: string; postal_code: string; building: string; unit: string;
  shipping_method: string; latitude: number | null; longitude: number | null;
  subtotal: number; shipping_fee: number; total: number; note: string | null;
  buyer_name: string; buyer_email: string;
};
type Line = { product_slug: string; product_name: string; quantity: number; unit_price: number; amount: number };
type Event = { id: number; from_status: string | null; to_status: string; note: string; created_at: string };
const statusName: Record<string,string> = {received:"دریافت‌شده",processing:"در حال پردازش",shipped:"ارسال‌شده",delivered:"تحویل‌شده",cancelled:"لغوشده"};
const deliveryName: Record<string,string> = {post:"پست",express:"ارسال سریع",pickup:"تحویل حضوری"};
const money = (n:number) => `${Number(n).toLocaleString("fa-IR")} تومان`;
const date = (s:string) => new Date(s).toLocaleString("fa-IR");
const panel = "rounded-2xl border border-[#796044] bg-[#1b1511] p-4 sm:p-6 print:break-inside-avoid print:border-gray-300 print:bg-white";

export default async function AdminOrderInvoice({params}:{params:Promise<{id:string}>}){
  const user = await currentUser();
  if(!user) redirect("/login");
  if(user.role!=="admin" || !await adminCan(user,"orders")) redirect("/admin");
  const {id} = await params;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) notFound();
  const orderResult = await db().query<Order>(`SELECT o.id,o.created_at,o.status,o.recipient_name,o.recipient_phone,
    o.shipping_city,o.shipping_address,o.shipping_province,o.postal_code,o.building,o.unit,
    o.shipping_method,o.latitude,o.longitude,o.subtotal::float8 AS subtotal,
    o.shipping_fee::float8 AS shipping_fee,o.total::float8 AS total,o.note,
    u.full_name AS buyer_name,u.email AS buyer_email
    FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1`,[id]);
  const order=orderResult.rows[0];
  if(!order) notFound();
  const [items,events] = await Promise.all([
    db().query<Line>(`SELECT product_slug,product_name,quantity,unit_price::float8 AS unit_price,
      amount::float8 AS amount FROM order_items WHERE order_id=$1 ORDER BY id`,[id]),
    db().query<Event>(`SELECT id,from_status,to_status,note,created_at FROM order_events
      WHERE order_id=$1 ORDER BY created_at,id`,[id]),
  ]);
  const images = await db().query<{slug:string;image:string|null}>(`SELECT p.slug, COALESCE((SELECT src FROM product_images WHERE product_slug=p.slug ORDER BY sort_order,id LIMIT 1),p.image) AS image FROM products p WHERE p.slug=ANY($1::text[])`,[items.rows.map(i=>i.product_slug)]);
  const imageBySlug = new Map(images.rows.map(i=>[i.slug,i.image]));
  return <main dir="rtl" className="mx-auto max-w-5xl space-y-5 px-3 py-6 text-[#f2e4cb] sm:px-6 print:max-w-none print:space-y-3 print:bg-white print:p-0 print:text-black">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href="/admin/orders" className="text-sm font-bold text-[#e6bb77] hover:underline">بازگشت به سفارش‌ها</Link>
      <PrintButton/>
    </div>
    <header className={`${panel} flex flex-wrap items-start justify-between gap-5 print:rounded-none print:border-0 print:border-b print:p-0 print:pb-4`}>
      <div><p className="text-sm font-black tracking-[.14em] text-[#e9bf7b] print:text-black">MISS DOOD</p>
        <h1 className="mt-2 text-2xl font-black">جزئیات سفارش و صورتحساب</h1>
        <p className="mt-2 text-xs text-[#c6b397] print:text-gray-600">این سند فاکتور رسمی مالیاتی یا گواهی پرداخت نیست.</p>
      </div>
      <div className="space-y-1 text-sm leading-7"><div>شناسه سفارش: <bdi dir="ltr" className="break-all font-semibold">{order.id}</bdi></div>
        <div>تاریخ ثبت: {date(order.created_at)}</div>
        <div>وضعیت: <strong>{statusName[order.status]??order.status}</strong></div>
        <div>نوع سفارش: ثبت اینترنتی</div>
        <div>وضعیت پرداخت: <strong>تأیید پرداخت از این اطلاعات قابل تشخیص نیست</strong></div>
      </div>
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      <section className={panel}><h2 className="mb-3 font-black text-[#edc88e] print:text-black">خریدار و گیرنده</h2>
        <dl className="space-y-2 text-sm leading-7"><div><dt className="inline text-[#c4ae90] print:text-gray-600">نام حساب: </dt><dd className="inline">{order.buyer_name||"ثبت نشده"}</dd></div>
          <div><dt className="inline text-[#c4ae90] print:text-gray-600">ایمیل حساب: </dt><dd className="inline break-all" dir="ltr">{order.buyer_email}</dd></div>
          <div><dt className="inline text-[#c4ae90] print:text-gray-600">تحویل‌گیرنده: </dt><dd className="inline">{order.recipient_name}</dd></div>
          <div><dt className="inline text-[#c4ae90] print:text-gray-600">شماره تماس: </dt><dd className="inline" dir="ltr">{order.recipient_phone}</dd></div></dl>
      </section>
      <section className={panel}><h2 className="mb-3 font-black text-[#edc88e] print:text-black">آدرس و نحوه تحویل</h2>
        <dl className="space-y-2 text-sm leading-7"><div>روش ارسال: <strong>{deliveryName[order.shipping_method]??order.shipping_method}</strong></div>
          <div>استان: {order.shipping_province||"ثبت نشده"} | شهر: {order.shipping_city}</div>
          <div className="whitespace-pre-wrap">نشانی: {order.shipping_address}</div>
          {order.building&&<div>پلاک: {order.building}</div>}{order.unit&&<div>واحد: {order.unit}</div>}
          {order.postal_code&&<div>کد پستی: <bdi dir="ltr">{order.postal_code}</bdi></div>}
          {order.latitude!==null&&order.longitude!==null&&<div className="print:hidden"><a className="text-[#e6bd80] underline" href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`} target="_blank" rel="noopener noreferrer">مشاهده مکان تحویل روی نقشه</a></div>}
          <div>هزینه ارسال: {money(order.shipping_fee)}</div>
        </dl>
      </section>
    </div>
    <section className={panel}><h2 className="mb-4 text-lg font-black text-[#edc88e] print:text-black">محصولات خریداری‌شده ({items.rows.length.toLocaleString("fa-IR")} ردیف)</h2>
      <div className="overflow-x-auto print:overflow-visible"><table className="w-full min-w-[640px] border-collapse text-right text-sm print:min-w-0"><thead className="bg-[#36291c] print:bg-gray-100"><tr>
        <th className="p-3">ردیف</th><th className="p-3">نام کالا و شناسه</th><th className="p-3">تعداد</th><th className="p-3">قیمت واحد</th><th className="p-3">جمع ردیف</th>
      </tr></thead><tbody>{items.rows.map((item,i)=><tr key={`${item.product_slug}-${i}`} className="border-b border-[#6b553e] print:border-gray-300"><td className="p-3">{(i+1).toLocaleString("fa-IR")}</td>
        <td className="p-3"><div className="flex items-center gap-3">{imageBySlug.get(item.product_slug)&&<img src={imageBySlug.get(item.product_slug)!} alt={item.product_name} className="size-14 shrink-0 rounded-lg object-cover print:size-12"/>}<div><strong>{item.product_name}</strong><div className="text-[10px] text-[#bda98c] print:text-gray-600">تصویر فعلی محصول</div></div></div><div dir="ltr" className="mt-1 text-xs text-[#c6ad85] print:text-gray-600">{item.product_slug}</div></td>
        <td className="p-3">{item.quantity.toLocaleString("fa-IR")}</td><td className="p-3 whitespace-nowrap">{money(item.unit_price)}</td><td className="p-3 whitespace-nowrap">{money(item.amount)}</td>
      </tr>)}</tbody></table></div>
      <dl className="mr-auto mt-6 max-w-sm space-y-3 text-sm"><div className="flex justify-between gap-4"><dt>جمع کالاها</dt><dd>{money(order.subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt>هزینه ارسال</dt><dd>{money(order.shipping_fee)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-[#806342] pt-3 text-lg font-black print:border-gray-300"><dt>مبلغ کل سفارش</dt><dd>{money(order.total)}</dd></div></dl>
    </section>
    {order.note&&<section className={panel}><h2 className="mb-2 font-bold">توضیحات سفارش</h2><p className="whitespace-pre-wrap text-sm">{order.note}</p></section>}
    <section className={`${panel} print:break-before-auto`}><h2 className="mb-3 font-bold text-[#edc88e] print:text-black">تاریخچه وضعیت سفارش</h2>
      {events.rows.length===0?<p className="text-sm">سابقه‌ای ثبت نشده است.</p>:<ol className="space-y-3 text-sm">{events.rows.map(event=><li key={event.id} className="border-b border-[#69523c] pb-2 print:border-gray-300">
        <strong>{statusName[event.to_status]??event.to_status}</strong> — {date(event.created_at)}
        {event.note&&<p className="mt-1 whitespace-pre-wrap text-xs text-[#c3af92] print:text-gray-700">{event.note}</p>}
      </li>)}</ol>}
    </section>
    <p className="text-xs leading-7 text-[#bfae93] print:text-gray-600">اقلام، تعداد و قیمت‌ها بر اساس اطلاعات ثبت‌شده هنگام سفارش هستند؛ تغییرات بعدی محصول روی این صورتحساب اثر ندارند. جزئیاتی که هنگام خرید ذخیره نشده‌اند قابل بازیابی تاریخی نیستند.</p>
  </main>;
}
