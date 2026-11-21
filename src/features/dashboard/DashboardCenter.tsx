"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Activity, ArrowUpLeft, BarChart3, Bell, Boxes, CheckCircle2, CircleAlert, ClipboardList, FilePenLine, Loader2, Package, RefreshCw, Search, ShoppingBag, Truck, Users, Wallet } from "lucide-react";
import DeliveryEditor from "@/features/dashboard/DeliveryEditor";

type Section="overview"|"customers"|"shipping";
type Customer={id:string;email:string;full_name:string;role:string;created_at:string;orderCount:number;orderValue:number};
type Shipping={city:string;fee:number;days:string;active:boolean};
type Overview={orderCount:number;openOrderCount:number;customerCount:number;activeProductCount:number;lowStockCount:number;openTicketCount:number;orderValue:number;last30Value:number;last30Orders:number};
type Timeline={day:string;value:number;count:number};
type BestSeller={slug:string;name:string;quantity:number;value:number};
type DashboardData={overview:Overview;customers:Customer[];shipping:Shipping[];timeline:Timeline[];bestsellers:BestSeller[];limits:{customers:number}};
const panel="rounded-2xl border border-[#675035]/65 bg-[#171111] shadow-[0_10px_36px_rgba(0,0,0,.15)]";
const field="min-h-11 w-full min-w-0 rounded-xl border border-[#6c5338] bg-[#0c0909] px-3 py-2 text-[#f9e8cd] outline-none placeholder:text-[#99856d] focus:border-[#e1bd7f] focus:ring-2 focus:ring-[#d2a762]/20";
const secondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#7e5d3d] px-4 py-2 text-sm text-[#f0d2a0] transition hover:bg-[#34231c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4c286] disabled:opacity-50";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ddba7d] px-4 py-2 text-sm font-bold text-[#21140e] transition hover:bg-[#f0d39d] disabled:opacity-50";
const money=(n:number|null|undefined)=>Number(n??0).toLocaleString("fa-IR")+" تومان";
const fmt=(n:number)=>Number(n??0).toLocaleString("fa-IR");
const quick=[{href:"/admin/orders",label:"سفارش‌ها",icon:ClipboardList,desc:"بررسی و مدیریت سفارش‌ها"},{href:"/admin/products",label:"محصولات",icon:Package,desc:"فهرست و ویرایش کالاها"},{href:"/admin/customers",label:"مشتریان",icon:Users,desc:"اطلاعات حساب‌های مشتری"},{href:"/admin/shipping",label:"ارسال و تعرفه‌ها",icon:Truck,desc:"هزینه و روش‌های ارسال"},{href:"/admin/content",label:"مدیریت محتوا",icon:FilePenLine,desc:"بنرها و اطلاعات سایت"},{href:"/admin/notifications",label:"اعلان‌ها",icon:Bell,desc:"پیگیری رویدادهای مهم"}];
export default function DashboardCenter({section}:{section:Section}){
 const [data,setData]=useState<DashboardData|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [search,setSearch]=useState("");
 const [page,setPage]=useState(1);
 const [scope,setScope]=useState<string|null>(null);
 const load=useCallback(async()=>{
  const response=await fetch("/api/admin",{cache:"no-store"});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(response.status===403?"اجازه مشاهده اطلاعات این بخش را ندارید.":`خطا در دریافت اطلاعات (${body.error??response.status})`);
  setData(body as DashboardData);
 },[]);
 useEffect(()=>{let active=true;fetch("/api/admin/access",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>{if(active)setScope(v?.scope??null)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{load().catch(e=>setError(e instanceof Error?e.message:"خطا در بارگذاری")).finally(()=>setLoading(false))},[load]);
 async function patch(payload:Record<string,unknown>,message:string){
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.error??"ذخیره تغییرات ناموفق بود.");
   await load();setSuccess(message);
  }catch(e){setError(e instanceof Error?e.message:"خطا در ثبت تغییرات")}finally{setBusy(false)}
 }
 const customers=useMemo(()=>data?.customers.filter(c=>(c.full_name+" "+c.email).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))??[],[data,search]);
 const shown=customers.slice((page-1)*15,page*15);
 const heading=section==="overview"?"نمای کلی فروشگاه":section==="customers"?"مشتریان":"ارسال و تعرفه‌ها";
 const subheading=section==="overview"?"اطلاعات مهم و کارهای روزانه، در یک نگاه":section==="customers"?"جست‌وجو و مشاهده حساب‌های مشتریان ثبت‌شده":"تنظیم هزینه و زمان ارسال به تفکیک شهر";
 return <main dir="rtl" className="min-w-0 bg-[radial-gradient(ellipse_at_top_right,rgba(98,30,49,.17),transparent_38%),#0e0b0b] px-3 py-5 text-[#f4e5c9] sm:px-6 lg:px-8">
   <div className="mx-auto max-w-7xl space-y-5">
    <header className={`${panel} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6`}>
      <div className="min-w-0"><p className="text-xs font-medium tracking-[.17em] text-[#cb9f65]">MISS DOOD / ADMIN</p><h1 className="mt-2 text-xl font-black sm:text-2xl">{heading}</h1><p className="mt-2 text-sm text-[#baa688]">{subheading}</p></div>
      <button className={secondary} disabled={loading||busy} onClick={()=>{setLoading(true);setError("");load().catch(e=>setError(String(e))).finally(()=>setLoading(false))}}><RefreshCw size={17}/> تازه‌سازی</button>
    </header>
    {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-[#a14c51] bg-[#472126] p-4 text-sm text-[#ffd0cd]"><CircleAlert size={18} className="shrink-0"/>{error}</div>}
    {success&&<div role="status" className="flex items-center gap-2 rounded-xl border border-[#807044] bg-[#30271b] p-4 text-sm text-[#f3da9d]"><CheckCircle2 size={18}/>{success}</div>}
    {loading?<div className={`${panel} flex min-h-48 items-center justify-center gap-3`} role="status"><Loader2 size={20} className="animate-spin"/>در حال دریافت اطلاعات…</div>:!data?<div className={`${panel} p-6 text-center`}>اطلاعات در دسترس نیست. با تازه‌سازی دوباره امتحان کنید.</div>:<>
    {section==="overview"&&<>
      <section aria-label="شاخص‌های فروشگاه" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {label:"سفارش‌های در جریان",value:fmt(data.overview.openOrderCount),sub:`از ${fmt(data.overview.orderCount)} سفارش`,icon:ShoppingBag},
          {label:"ارزش سفارش‌ها",value:money(data.overview.orderValue),sub:"غیرلغوشده؛ نه پرداخت قطعی",icon:Wallet},
          {label:"مشتریان",value:fmt(data.overview.customerCount),sub:"حساب‌های ثبت‌شده",icon:Users},
          {label:"کالاهای فعال",value:fmt(data.overview.activeProductCount),sub:`${fmt(data.overview.lowStockCount)} کالا با موجودی کم`,icon:Boxes},
        ].map(item=><article key={item.label} className={`${panel} min-w-0 p-4 sm:p-5`}><div className="flex justify-between gap-2"><p className="text-sm text-[#baa78b]">{item.label}</p><item.icon className="text-[#d8ae76]" size={20}/></div><p className="mt-3 break-words text-xl font-black text-[#ffe3ac] sm:text-2xl">{item.value}</p><p className="mt-2 text-xs text-[#a08c72]">{item.sub}</p></article>)}
      </section>
      <section className={`${panel} p-4 sm:p-5`}><div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold">دسترسی سریع</h2><span className="text-xs text-[#a99072]">بخش‌های اصلی پنل</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{quick.filter(q=>scope==="owner"||scope==="manager"||!scope||(["/admin/orders","/admin/notifications"].includes(q.href)&&scope==="orders")||(["/admin/products","/admin/content"].includes(q.href)&&scope==="catalog")||(q.href==="/admin/notifications")).map(({href,label,desc,icon:Icon})=><Link key={href} href={href} className="group flex min-h-20 items-center gap-3 rounded-xl border border-[#57412e] bg-[#1e1614] p-4 hover:border-[#cb9a5c] focus-visible:outline-2 focus-visible:outline-[#e7bc7d]"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#552b30]/35 text-[#e6c182]"><Icon size={20}/></span><div className="min-w-0 flex-1"><b className="block text-sm">{label}</b><span className="mt-1 block text-xs text-[#ad987f]">{desc}</span></div><ArrowUpLeft className="shrink-0 text-[#aa8a60] transition group-hover:-translate-x-1" size={16}/></Link>)}</div></section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <article className={`${panel} min-w-0 p-4 sm:p-5`}><div className="mb-4 flex items-center gap-2"><Activity className="text-[#d8b27b]" size={20}/><h2 className="font-bold">روند ۷ روز اخیر</h2></div><p className="mb-3 text-xs text-[#a79379]">ارزش سفارش‌های غیرلغوشده، تومان</p><div className="flex h-44 items-end gap-2 border-b border-[#574432] pb-2" role="img" aria-label="نمودار سفارش‌های هفت روز گذشته">{data.timeline.map(x=>{const max=Math.max(1,...data.timeline.map(y=>y.value));return <div key={x.day} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${x.day}: ${money(x.value)}`}><span className="text-[10px] text-[#e4bd84]">{fmt(x.count)}</span><div className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#6a2c3c] to-[#dfb87c]" style={{height:Math.max(6,Math.round(x.value/max*125))}}/><span className="text-[10px] text-[#a3937d]" dir="ltr">{x.day.slice(5)}</span></div>})}</div><div className="mt-4 flex flex-wrap justify-between gap-3 text-sm"><span className="text-[#bda88d]">۳۰ روز اخیر: <b className="text-[#e8c38a]">{fmt(data.overview.last30Orders)} سفارش</b></span><span className="text-[#e8c38a]">{money(data.overview.last30Value)}</span></div></article>
        <article className={`${panel} min-w-0 p-4 sm:p-5`}><div className="mb-4 flex items-center gap-2"><BarChart3 className="text-[#d8b27b]" size={20}/><h2 className="font-bold">کالاهای پرتکرار</h2></div>{data.bestsellers.length?<div className="space-y-3">{data.bestsellers.slice(0,6).map((p,i)=><div key={p.slug} className="flex items-center gap-3 rounded-xl bg-[#221816] p-3"><span className="text-xs text-[#c99b65]">{fmt(i+1)}</span><span className="min-w-0 flex-1 truncate text-sm" title={p.name}>{p.name}</span><span className="whitespace-nowrap text-xs text-[#dfbb87]">{fmt(p.quantity)} عدد</span></div>)}</div>:<p className="text-sm text-[#a9967d]">هنوز داده‌ای ثبت نشده است.</p>}</article>
      </section>
    </>}
    {section==="customers"&&<section className={`${panel} p-4 sm:p-6`}><label className="mb-4 block text-sm text-[#d3b990]" htmlFor="customer-search">جست‌وجوی مشتری</label><div className="relative mb-4"><Search size={19} className="absolute right-3 top-3 text-[#bba071]"/><input id="customer-search" className={`${field} pr-11`} placeholder="نام یا ایمیل" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div><p className="mb-4 text-xs text-[#a69379]">{fmt(customers.length)} نتیجه از {fmt(data.customers.length)} حساب دریافت‌شده</p><div className="grid gap-3 sm:hidden">{shown.map(c=><article key={c.id} className="min-w-0 space-y-2 rounded-xl border border-[#5d482e] bg-[#100d0c] p-4"><div className="flex justify-between gap-2"><b className="min-w-0 truncate">{c.full_name||"بدون نام"}</b><span className="shrink-0 text-xs text-[#dcb780]">{c.role==="admin"?"مدیر":"مشتری"}</span></div><p className="break-all text-sm text-[#c9b292]" dir="ltr">{c.email}</p><p className="text-xs text-[#ab9980]">{fmt(c.orderCount)} سفارش · {money(c.orderValue)}</p><p className="text-xs text-[#ab9980]">ثبت‌نام: {new Date(c.created_at).toLocaleDateString("fa-IR")}</p></article>)}</div><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[650px] text-right text-sm"><thead><tr className="border-b border-[#5c462e] text-[#bfa683]"><th className="py-3">مشتری</th><th>ایمیل</th><th>نقش</th><th>سفارش</th><th>ارزش سفارش</th><th>تاریخ ثبت‌نام</th></tr></thead><tbody>{shown.map(c=><tr key={c.id} className="border-b border-[#3d3026] last:border-0"><td className="py-3 font-bold">{c.full_name||"بدون نام"}</td><td className="px-2"><bdi dir="ltr">{c.email}</bdi></td><td>{c.role==="admin"?"مدیر":"مشتری"}</td><td>{fmt(c.orderCount)}</td><td>{money(c.orderValue)}</td><td>{new Date(c.created_at).toLocaleDateString("fa-IR")}</td></tr>)}</tbody></table></div>{!customers.length&&<p className="py-10 text-center text-sm text-[#baa78a]">مشتری‌ای پیدا نشد.</p>}<div className="mt-5 flex flex-wrap items-center justify-center gap-3"><button className={secondary} disabled={page<=1} onClick={()=>setPage(v=>v-1)}>قبلی</button><span className="text-sm text-[#c5ae8b]">صفحه {fmt(page)} از {fmt(Math.max(1,Math.ceil(customers.length/15)))}</span><button className={secondary} disabled={page*15>=customers.length} onClick={()=>setPage(v=>v+1)}>بعدی</button></div><p className="mt-4 text-xs leading-6 text-[#a9967e]">برای تغییر نقش مدیر از بخش «مدیران و دسترسی» استفاده کنید. این صفحه فقط ۳۰۰ مشتری اخیر موجود در داده داشبورد را پوشش می‌دهد.</p></section>}
    {section==="shipping"&&<div className="space-y-5"><section className={`${panel} p-4 sm:p-6`}><h2 className="mb-2 text-lg font-bold">تعرفه‌های ثبت‌شده</h2><p className="mb-5 text-xs text-[#aa967e]">هزینه ارسال هر شهر هنگام ثبت سفارش استفاده می‌شود.</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.shipping.map(s=><article key={s.city} className="rounded-xl border border-[#58442f] bg-[#0d0b0a] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{s.city}</b><button className={secondary} disabled={busy} aria-label={`تغییر وضعیت ${s.city}`} onClick={()=>void patch({type:"shippingStatus",city:s.city,active:!s.active},"وضعیت تعرفه تغییر کرد.")}>{s.active?"فعال":"غیرفعال"}</button></div><p className="mt-3 text-lg font-bold text-[#e8c58c]">{money(s.fee)}</p><p className="mt-2 text-xs text-[#b39b7f]">زمان تحویل: {s.days}</p></article>)}</div></section><section className={`${panel} p-4 sm:p-6`}><h2 className="mb-4 text-lg font-bold">افزودن یا به‌روزرسانی تعرفه</h2><form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);void patch({type:"shipping",city:String(f.get("city")??""),fee:Number(f.get("fee")),days:String(f.get("days")??"")},"تعرفه ثبت شد.")}}><label className="text-sm">نام شهر<input className={`${field} mt-2`} name="city" required maxLength={120}/></label><label className="text-sm">هزینه (تومان)<input className={`${field} mt-2`} name="fee" type="number" min="0" max="100000000" step="1" required/></label><label className="text-sm">زمان ارسال<input className={`${field} mt-2`} name="days" required maxLength={120} placeholder="۲ تا ۴ روز کاری"/></label><button className={`${primary} self-end`} disabled={busy}>{busy?"در حال ذخیره...":"ثبت یا به‌روزرسانی"}</button></form></section><DeliveryEditor/></div>}
    </>}
   </div>
  </main>;
}
