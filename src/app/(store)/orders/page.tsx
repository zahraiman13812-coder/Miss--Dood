"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Search, RefreshCw, PackageSearch, ClipboardList, CheckCircle2, Truck, Clock3 } from "lucide-react";
import { productPrice } from "@/data/mock/latestProducts";

type Status = "received" | "processing" | "shipped" | "delivered" | "cancelled";
type Order = { id: string; status: Status; date: string; total: number; payment_status: string; items: { name: string; quantity: number; amount: number }[] };
const statusLabel: Record<Status,string> = { received:"ثبت سفارش", processing:"در حال آماده‌سازی", shipped:"تحویل به پست", delivered:"تحویل شده", cancelled:"لغو شده" };
const steps: Status[] = ["received","processing","shipped","delivered"];
const inputClass = "min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-header px-4 text-left outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function OrdersPage() {
  const [orders,setOrders] = useState<Order[]>([]);
  const [message,setMessage] = useState("در حال دریافت سفارش‌ها...");
  const [query,setQuery] = useState("");
  const [submittedQuery,setSubmittedQuery] = useState("");
  const [loading,setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/orders",{cache:"no-store"});
      if(response.status===401) throw new Error("برای مشاهده و پیگیری سفارش‌ها ابتدا وارد حساب کاربری شوید.");
      if(!response.ok) throw new Error("دریافت سفارش‌ها ناموفق بود. دوباره تلاش کنید.");
      const data = await response.json();
      setOrders(Array.isArray(data.orders)?data.orders:[]);
    } catch(error) { setMessage(error instanceof Error?error.message:"خطای ارتباط با سرور"); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void load();},[load]);
  const filtered = useMemo(()=>orders.filter(order=>order.id.toLowerCase().includes(submittedQuery.toLowerCase().trim())),[orders,submittedQuery]);
  function search(event:FormEvent<HTMLFormElement>){event.preventDefault();setSubmittedQuery(query);}
  return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
    <header className="overflow-hidden rounded-3xl border border-line bg-linear-to-br from-panel to-header p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"><PackageSearch size={28}/></div>
        <div className="min-w-0"><p className="text-sm font-semibold text-accent">MISS DOOD</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">پیگیری سفارش</h1><p className="mt-2 text-sm leading-7 text-muted">شناسه سفارش را جست‌وجو کنید یا وضعیت سفارش‌های اخیرتان را ببینید.</p></div>
      </div>
      <form onSubmit={search} role="search" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="order-search">شناسه سفارش</label>
        <input id="order-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="شناسه سفارش را وارد کنید…" dir="ltr" className={inputClass}/>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-on-accent transition hover:brightness-95"><Search size={18}/> جست‌وجوی سفارش</button>
      </form>
    </header>

    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="text-accent" size={20}/> سفارش‌های شما</h2>
      <button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm hover:border-accent disabled:opacity-50"><RefreshCw size={16} className={loading?"animate-spin":""}/> به‌روزرسانی</button>
    </div>
    {message && <div role="status" className="rounded-2xl border border-line bg-panel p-5 text-sm leading-7">{message}{message.includes("وارد حساب")&&<Link href="/login" className="ms-2 font-bold text-accent">ورود به حساب</Link>}{!message.includes("وارد حساب")&&<button onClick={()=>void load()} className="ms-2 font-bold text-accent">تلاش دوباره</button>}</div>}
    {!message && !filtered.length && <div className="rounded-2xl border border-dashed border-line bg-panel p-8 text-center"><PackageSearch className="mx-auto mb-3 text-muted" size={34}/><p className="font-semibold">{submittedQuery?"سفارشی با این شناسه پیدا نشد.":"هنوز سفارشی ثبت نکرده‌اید."}</p><p className="mt-2 text-sm text-muted">{submittedQuery?"شناسه را بررسی کنید و دوباره جست‌وجو کنید.":"بعد از ثبت سفارش، وضعیت آن در این بخش نمایش داده می‌شود."}</p>{submittedQuery&&<button onClick={()=>{setQuery("");setSubmittedQuery("");}} className="mt-4 text-sm font-bold text-accent">نمایش همه سفارش‌ها</button>}</div>}
    <div className="space-y-4">{filtered.map(order=>{
      const current = steps.indexOf(order.status);
      return <article key={order.id} className="space-y-5 rounded-2xl border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs text-muted">کد پیگیری</p><p className="mt-1 break-all font-mono text-sm" dir="ltr">{order.id}</p><p className="mt-2 text-xs text-muted">{new Date(order.date).toLocaleString("fa-IR")}</p></div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${order.status==="cancelled"?"bg-red-500/10 text-red-600":"bg-accent/10 text-accent"}`}><Clock3 size={14}/>{statusLabel[order.status]??order.status}</span><span className="rounded-full border border-amber-700/50 px-3 py-2 text-xs text-amber-300">{order.payment_status==="paid"?"پرداخت تأییدشده":order.payment_status==="refunded"?"وجه برگشت داده شد":"پرداخت تأیید نشده"}</span>
        </div>
        {order.status!=="cancelled"&&<div className="grid grid-cols-4 gap-1" aria-label="مراحل سفارش">{steps.map((step,index)=>{const done=index<=current;const Icon=index===0?ClipboardList:index===1?Clock3:index===2?Truck:CheckCircle2;return <div key={step} className="min-w-0 text-center"><div className={`mx-auto flex size-9 items-center justify-center rounded-full ${done?"bg-accent text-on-accent":"bg-header text-muted"}`}><Icon size={17}/></div><p className={`mt-2 text-[10px] leading-5 sm:text-xs ${done?"font-bold text-accent":"text-muted"}`}>{statusLabel[step]}</p></div>;})}</div>}
        <div className="border-t border-line pt-4"><ul className="space-y-2">{order.items.map((item,index)=><li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0">{item.name} <bdi>× {item.quantity.toLocaleString("fa-IR")}</bdi></span><span className="shrink-0">{productPrice(item.amount)}</span></li>)}</ul><div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-bold"><span>مبلغ کل</span><span className="text-accent">{productPrice(order.total)}</span></div></div>
      </article>;
    })}</div>
    <div className="text-center"><Link href="/shop" className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:border-accent hover:text-accent">بازگشت به فروشگاه</Link></div>
  </main>;
}
