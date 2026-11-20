"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, BarChart3, Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  CircleAlert, ClipboardList, Download, ExternalLink, HeartPulse, LayoutDashboard,
  LifeBuoy, Loader2, Package, Pencil, Plus, RefreshCw, Search, Settings2,
  ShieldCheck, ShoppingBag, Store, Truck, Users, Wallet, X,
} from "lucide-react";
import { brands } from "@/data/brands";
import { categories } from "@/data/navigation";
import DeliveryEditor from "@/features/dashboard/DeliveryEditor";
import SupportDesk from "@/features/support/SupportDesk";

type Tab = "overview" | "orders" | "products" | "customers" | "shipping" | "support";
type Product = { slug:string;name:string;brand:string;category:string;description:string;image:string;priceToman:number|null;stock:number;active:boolean;updated_at:string };
type Order = { id:string;status:string;date:string;recipient_name:string;recipient_phone:string;shipping_address:string;shipping_city:string;total:number;subtotal:number;shipping_fee:number;items:{name:string;slug:string;quantity:number;amount:number}[] };
type Shipping = {city:string;fee:number;days:string;active:boolean};
type Customer = {id:string;email:string;full_name:string;role:string;created_at:string;orderCount:number;orderValue:number};
type Overview = {orderCount:number;openOrderCount:number;customerCount:number;activeProductCount:number;lowStockCount:number;openTicketCount:number;orderValue:number;last30Value:number;last30Orders:number};
type Timeline = {day:string;value:number;count:number};
type BestSeller = {slug:string;name:string;quantity:number;value:number};
type DashboardData = {orders:Order[];products:Product[];shipping:Shipping[];customers:Customer[];overview:Overview;timeline:Timeline[];bestsellers:BestSeller[];limits:{orders:number;customers:number;products:number}};
type ProductDraft = {slug:string;name:string;category:string;brand:string;description:string;image:string;price:string;stock:string};
const emptyDraft:ProductDraft={slug:"",name:"",category:"cigarettes",brand:"",description:"",image:"",price:"",stock:"0"};
const orderStates:Record<string,{label:string;className:string}>={
  received:{label:"دریافت‌شده",className:"text-[#f2cc82] border-[#ae874e]/40 bg-[#7a5723]/15"},
  processing:{label:"در حال پردازش",className:"text-[#f4d386] border-[#be8c43]/45 bg-[#6d4517]/20"},
  shipped:{label:"ارسال‌شده",className:"text-[#afc8f4] border-[#6688b4]/45 bg-[#233956]/20"},
  delivered:{label:"تحویل‌شده",className:"text-[#aee4b1] border-[#527b50]/40 bg-[#18432b]/20"},
  cancelled:{label:"لغوشده",className:"text-[#f3a9af] border-[#9a4650]/45 bg-[#5c1521]/20"},
};
const transitions:Record<string,string[]>={received:["processing","cancelled"],processing:["shipped","cancelled"],shipped:["delivered","cancelled"],delivered:[],cancelled:[]};
const menu:{id:Tab;title:string;icon:typeof LayoutDashboard}[]=[
  {id:"overview",title:"داشبورد",icon:LayoutDashboard},
  {id:"orders",title:"سفارش‌ها",icon:ShoppingBag},
  {id:"products",title:"محصولات و موجودی",icon:Boxes},
  {id:"customers",title:"مشتریان",icon:Users},
  {id:"shipping",title:"ارسال و تعرفه‌ها",icon:Truck},
  {id:"support",title:"پشتیبانی",icon:LifeBuoy},
];
const panel="rounded-[24px] border border-[#58432c]/80 bg-[#15110e] shadow-[0_16px_50px_rgba(0,0,0,.17)]";
const field="min-h-11 w-full rounded-xl border border-[#665032] bg-[#0c0a08] px-3 py-2.5 text-[#f5ecd9] outline-none transition placeholder:text-[#87745c] focus:border-[#dfb875] focus:ring-2 focus:ring-[#b98b4b]/20";
const secondary="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#715735] bg-[#1b1510] px-4 text-sm font-bold text-[#e8cca0] transition hover:border-[#d7ad68] hover:bg-[#38231a] disabled:opacity-40";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ebc680] to-[#b78842] px-5 text-sm font-black text-[#171007] shadow-[0_8px_22px_rgba(180,123,48,.13)] transition hover:brightness-110 disabled:opacity-50";
const money=(amount:number|null|undefined)=>amount==null?"قیمت نامشخص":`${Number(amount).toLocaleString("fa-IR")} تومان`;
const date=(value:string)=>new Date(value).toLocaleDateString("fa-IR",{year:"numeric",month:"short",day:"numeric"});
const count=(n:number)=>Number(n??0).toLocaleString("fa-IR");
const status=(s:string)=> <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${orderStates[s]?.className??"text-[#dbc8ae] border-[#665032]"}`}>{orderStates[s]?.label??s}</span>;
const catLabel=(id:string)=>categories.find(([slug])=>slug===id)?.[1]??id;
const brandLabel=(id:string)=>brands.find(b=>b.slug===id)?.name??id;

function Metric({title,value,sub,icon:Icon}: {title:string;value:string;sub:string;icon:typeof Activity}) {
  return <article className={`${panel} relative overflow-hidden p-5`}>
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b48651]/65 to-transparent"/>
    <div className="flex justify-between gap-3"><p className="text-sm text-[#bba887]">{title}</p><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#86623b]/50 bg-[#8b3040]/13 text-[#e4c082]"><Icon size={20}/></span></div>
    <strong className="mt-2 block text-2xl font-black text-[#f8e9ce] sm:text-[28px]">{value}</strong><p className="mt-2 text-xs text-[#96856d]">{sub}</p>
  </article>;
}
function Heading({title,caption,children}:{title:string;caption?:string;children?:ReactNode}) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-[#f6e7c9]">{title}</h2>{caption&&<p className="mt-1 text-sm text-[#a79678]">{caption}</p>}</div>{children}</div>;
}
function Empty({label}:{label:string}) {return <p className="rounded-2xl border border-dashed border-[#5e4a32] p-10 text-center text-sm text-[#ac997b]">{label}</p>}
function PageControl({page,count:total,pageSize,onChange}:{page:number;count:number;pageSize:number;onChange:(next:number)=>void}){
  const pages=Math.max(1,Math.ceil(total/pageSize));if(pages===1)return null;
  return <div className="flex items-center justify-center gap-3 pt-4"><button className={secondary} disabled={page===1} onClick={()=>onChange(page-1)} aria-label="صفحه قبلی"><ChevronRight size={16}/></button><span className="text-xs text-[#cbb995]">صفحه {count(page)} از {count(pages)}</span><button className={secondary} disabled={page===pages} onClick={()=>onChange(page+1)} aria-label="صفحه بعدی"><ChevronLeft size={16}/></button></div>;
}

export default function AdminPage(){
  const [active,setActive]=useState<Tab>("overview");
  const [editableCategories,setEditableCategories]=useState<{slug:string;label:string}[]>(categories.map(([slug,label])=>({slug,label})));
  useEffect(()=>{fetch("/api/admin/content",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>{if(v?.catalog?.categories)setEditableCategories(v.catalog.categories)}).catch(()=>{});},[]);
  const [data,setData]=useState<DashboardData|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [stockFilter,setStockFilter]=useState("all");
  const [page,setPage]=useState(1);
  const [draft,setDraft]=useState<ProductDraft>(emptyDraft);
  const [editing,setEditing]=useState(false);
  const [selected,setSelected]=useState<string|null>(null);

  const reload=useCallback(async()=>{
    const result=await fetch("/api/admin",{cache:"no-store"});
    const body=await result.json().catch(()=>({}));
    if(!result.ok)throw new Error(result.status===403?"دسترسی مدیر برای این حساب فعال نیست.":`دریافت اطلاعات مدیریت ناموفق بود (${body.error??result.status}).`);
    setData(body as DashboardData);
  },[]);
  useEffect(()=>{reload().catch(e=>setError(e instanceof Error?e.message:"خطای دریافت اطلاعات")).finally(()=>setLoading(false));},[reload]);
  async function patch(body:Record<string,unknown>,message="تغییرات ذخیره شد."){
    setBusy(true);setError("");setSuccess("");
    try{
      const response=await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error??"ذخیره اطلاعات ناموفق بود.");
      await reload();setSuccess(message);return true;
    }catch(err){setError(err instanceof Error?err.message:"خطا در ذخیره اطلاعات");return false;}
    finally{setBusy(false);}
  }
  function go(tab:Tab){setActive(tab);setSearch("");setPage(1);setSelected(null);setError("");setSuccess("");}
  const orders=useMemo(()=> (data?.orders??[]).filter(o=>(statusFilter==="all"||o.status===statusFilter)&&`${o.id} ${o.recipient_name} ${o.recipient_phone} ${o.shipping_city}`.toLowerCase().includes(search.toLowerCase())),[data,search,statusFilter]);
  const products=useMemo(()=>(data?.products??[]).filter(p=>(stockFilter==="all"||(stockFilter==="low"&&p.stock<=5)||(stockFilter==="active"&&p.active)||(stockFilter==="hidden"&&!p.active))&&`${p.name} ${p.slug} ${p.brand} ${p.category}`.toLowerCase().includes(search.toLowerCase())),[data,search,stockFilter]);
  const customers=useMemo(()=>(data?.customers??[]).filter(c=>`${c.full_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())),[data,search]);
  const size=12;const slice=<T,>(items:T[])=>items.slice((page-1)*size,page*size);
  function loadDraft(p:Product){setDraft({slug:p.slug,name:p.name,category:p.category,brand:p.brand||"",description:p.description||"",image:p.image||"",price:p.priceToman==null?"":String(p.priceToman),stock:String(p.stock)});setEditing(true);window.scrollTo({top:0,behavior:"smooth"});}
  function resetDraft(){setDraft(emptyDraft);setEditing(false)}
  async function saveProduct(e:FormEvent<HTMLFormElement>){e.preventDefault();const was=await patch({type:"product",slug:draft.slug,name:draft.name,category:draft.category,brand:draft.brand,description:draft.description,image:draft.image,priceToman:draft.price===""?null:Number(draft.price),stock:Number(draft.stock)},"محصول با موفقیت ذخیره شد.");if(was)resetDraft();}
  function csvExport(){
    if(!orders.length)return;
    const escape=(v:unknown)=>{const raw=String(v??"");const safe=/^[=+@\-\t\r]/.test(raw)?"'"+raw:raw;return `"${safe.replace(/"/g,'""')}"`;};
    const rows=[["Order ID","Date","Status","Recipient","City","Amount (Toman)"],...orders.map(o=>[o.id,o.date,o.status,o.recipient_name,o.shipping_city,String(o.total)])];
    const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(escape).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
    const href=URL.createObjectURL(blob);const link=document.createElement("a");link.href=href;link.download="miss-dood-orders.csv";link.click();URL.revokeObjectURL(href);
  }

  return <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,rgba(108,25,43,.18),transparent_36%),#0b0908] px-3 py-5 text-[#f4e9d5] sm:px-5 lg:px-8 lg:py-8"><div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pt-5"><Link href="/admin/content" className="rounded-xl border border-[#b68f56] bg-[#342020] px-4 py-3 text-sm font-bold text-[#f6d392]">مدیریت محتوا، بنرها و دسته‌بندی‌ها</Link><Link href="/admin/team" className="rounded-xl border border-[#b68f56] bg-[#342020] px-4 py-3 text-sm font-bold text-[#f6d392]">مدیران و دسترسی‌ها</Link></div>
    <div className="mx-auto max-w-[1500px]">
      <header className={`${panel} mb-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
        <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl border border-[#b88c53]/55 bg-[#6a2233]/25 text-[#edc77e]"><ShieldCheck size={24}/></span><div><p className="text-xs tracking-[.26em] text-[#c69e65]">MISS DOOD · CONTROL CENTER</p><h1 className="mt-1 text-2xl font-black">مدیریت فروشگاه</h1><p className="mt-1 text-xs text-[#a69477]">مدیریت یکپارچه سفارش‌ها، کالاها و مشتریان</p></div></div>
        <div className="flex flex-wrap gap-2"><button className={secondary} disabled={busy||loading} onClick={()=>{setLoading(true);reload().catch(e=>setError(e.message)).finally(()=>setLoading(false));}}><RefreshCw size={17}/> تازه‌سازی</button><Link className={secondary} href="/shop"><Store size={17}/> مشاهده فروشگاه <ExternalLink size={14}/></Link></div>
      </header>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className={`${panel} min-w-0 p-3 lg:sticky lg:top-32`}>
          <div className="mb-3 px-3 py-3 text-xs font-bold text-[#b99f75]">بخش‌های مدیریت</div>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="بخش‌های پنل مدیریت">
            {menu.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" onClick={()=>go(item.id)} aria-current={active===item.id?"page":undefined} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-right text-sm font-bold transition ${active===item.id?"border border-[#b68c4b]/65 bg-[#6f2632]/30 text-[#f2d69b]":"border border-transparent text-[#c9b797] hover:bg-[#302017] hover:text-[#f7e4b9]"}`}><Icon size={18}/>{item.title}{item.id==="orders"&&data?.overview.openOrderCount?<span className="ms-auto rounded-full bg-[#762c3d] px-2 text-xs text-white">{count(data.overview.openOrderCount)}</span>:null}</button>})}
          </nav>
          <div className="mt-4 border-t border-[#5b4934] px-3 pt-4 text-xs leading-6 text-[#9f8a6b]">این پنل فقط با حساب دارای نقش مدیر قابل دسترسی است. قیمت‌ها و وضعیت سفارش‌ها از PostgreSQL دریافت می‌شوند.</div>
        </aside>
        <div className="min-w-0 space-y-5">
          {error&&<div role="alert" className="flex items-start gap-3 rounded-2xl border border-[#b25361] bg-[#631a29]/30 p-4 text-sm text-[#f7bfc6]"><CircleAlert className="shrink-0" size={20}/>{error}<button className="ms-auto" aria-label="بستن خطا" onClick={()=>setError("")}><X size={17}/></button></div>}
          {success&&<div role="status" className="flex items-center gap-3 rounded-2xl border border-[#9a804e]/60 bg-[#2e271a]/70 p-4 text-sm font-bold text-[#f0d8a4]"><CheckCircle2 size={19}/>{success}<button className="ms-auto" aria-label="بستن پیام" onClick={()=>setSuccess("")}><X size={17}/></button></div>}
          {loading?<div className={`${panel} flex min-h-56 items-center justify-center gap-3`} role="status"><Loader2 size={24} className="animate-spin text-[#e5c17c]"/>در حال دریافت اطلاعات واقعی فروشگاه…</div>:!data?<div className={`${panel} p-7 text-center`}><p>اطلاعات پنل در دسترس نیست.</p><button className={`${primary} mt-5`} onClick={()=>{setLoading(true);reload().catch(e=>setError(e.message)).finally(()=>setLoading(false));}}>تلاش مجدد</button></div>:<>
            {active==="overview"&&<>
              <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <Metric title="ارزش سفارش‌ها" value={money(data.overview.orderValue)} sub="جمع سفارش‌های غیرلغوشده، نه دریافتی قطعی" icon={Wallet}/>
                <Metric title="سفارش‌های در جریان" value={count(data.overview.openOrderCount)} sub={`از مجموع ${count(data.overview.orderCount)} سفارش`} icon={ShoppingBag}/>
                <Metric title="مشتریان ثبت‌شده" value={count(data.overview.customerCount)} sub="حساب‌های مشتری در دیتابیس" icon={Users}/>
                <Metric title="محصولات فعال" value={count(data.overview.activeProductCount)} sub={`${count(data.overview.lowStockCount)} محصول با موجودی ۵ یا کمتر`} icon={Boxes}/>
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className={`${panel} p-5`}><Heading title="روند ۷ روز گذشته" caption="ارزش سفارش‌های غیرلغوشده؛ مبالغ به تومان"/>
                  {(()=>{const max=Math.max(1,...data.timeline.map(x=>x.value));return <div className="flex h-56 items-end gap-2 overflow-hidden border-b border-[#665032] pb-1" role="img" aria-label="نمودار ارزش سفارش‌های هفت روز اخیر">{data.timeline.map(t=><div key={t.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${t.day} — ${money(t.value)} — ${count(t.count)} سفارش`}><span className="text-[10px] text-[#d5b884]">{count(t.count)}</span><div className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-[#622330] via-[#a97743] to-[#edc987]" style={{height:`${Math.max(7,(t.value/max)*162)}px`}}/><span className="text-[10px] text-[#9d8d70]" dir="ltr">{t.day.slice(5)}</span></div>)}</div>})()}
                  <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#211810] p-4"><p className="text-xs text-[#b09b7a]">۳۰ روز اخیر</p><b className="mt-2 block text-lg text-[#e9c889]">{money(data.overview.last30Value)}</b></div><div className="rounded-xl bg-[#211810] p-4"><p className="text-xs text-[#b09b7a]">تعداد سفارش ۳۰ روز</p><b className="mt-2 block text-lg text-[#e9c889]">{count(data.overview.last30Orders)}</b></div></div>
                </div>
                <div className={`${panel} p-5`}><Heading title="کالاهای پرتکرار" caption="بر اساس تعداد واحد سفارش‌داده‌شده"/>{data.bestsellers.length?data.bestsellers.map((p,i)=><div key={p.slug} className="flex items-center gap-3 border-b border-[#4f3d2c] py-3 last:border-0"><span className="grid size-9 place-items-center rounded-xl bg-[#6e2a3a]/30 text-[#e4c082]">{count(i+1)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="text-xs text-[#a38d6e]">{count(p.quantity)} واحد</p></div><span className="text-xs text-[#d5b78a]">{money(p.value)}</span></div>):<Empty label="هنوز داده‌ای برای نمایش وجود ندارد."/>}</div>
              </section>
              <div className="grid gap-4 md:grid-cols-3"><button className={`${panel} flex items-center gap-3 p-5 text-right transition hover:border-[#bb9153]`} onClick={()=>go("orders")}><ClipboardList className="text-[#e5c17c]"/><span><b className="block">مدیریت سفارش‌ها</b><small className="text-[#a58f70]">پیگیری و تغییر وضعیت</small></span><ArrowLeft className="ms-auto text-[#c99e63]" size={16}/></button><button className={`${panel} flex items-center gap-3 p-5 text-right transition hover:border-[#bb9153]`} onClick={()=>go("products")}><Package className="text-[#e5c17c]"/><span><b className="block">مدیریت محصولات</b><small className="text-[#a58f70]">قیمت، موجودی و انتشار</small></span><ArrowLeft className="ms-auto text-[#c99e63]" size={16}/></button><button className={`${panel} flex items-center gap-3 p-5 text-right transition hover:border-[#bb9153]`} onClick={()=>go("support")}><HeartPulse className="text-[#e5c17c]"/><span><b className="block">پشتیبانی</b><small className="text-[#a58f70]">{count(data.overview.openTicketCount)} تیکت باز</small></span><ArrowLeft className="ms-auto text-[#c99e63]" size={16}/></button></div>
            </>}
            {active==="orders"&&<section className={`${panel} p-4 sm:p-6`}><Heading title="مدیریت سفارش‌ها" caption="آخرین ۳۰۰ سفارش؛ تغییر وضعیت با رعایت مراحل پردازش"><button className={secondary} onClick={csvExport}><Download size={16}/> دریافت CSV</button></Heading>
              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_200px]"><label className="relative"><Search className="absolute right-3 top-3 text-[#b89a6e]" size={18}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="جست‌وجو با نام، تلفن، شناسه یا شهر" className={`${field} pr-10`}/></label><select className={field} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}}><option value="all">همه وضعیت‌ها</option>{Object.entries(orderStates).map(([id,s])=><option key={id} value={id}>{s.label}</option>)}</select></div>
              <p className="mb-3 text-xs text-[#a99476]">{count(orders.length)} نتیجه از آخرین سفارش‌های دریافتی</p>
              {orders.length?<div className="space-y-3">{slice(orders).map(o=><article key={o.id} className="rounded-2xl border border-[#4b3b2c] bg-[#0e0c0a] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-3"><strong className="text-sm text-[#fff1d8]">{o.recipient_name}</strong>{status(o.status)}</div><p className="text-xs text-[#a99679]">{date(o.date)} · {o.shipping_city}</p><code dir="ltr" className="block break-all text-xs text-[#cba76d]">{o.id}</code><p className="text-sm font-bold text-[#f1d19b]">{money(o.total)}</p></div><div className="flex flex-wrap items-center gap-2"><button className={secondary} onClick={()=>setSelected(selected===o.id?null:o.id)}>{selected===o.id?"بستن جزئیات":"مشاهده جزئیات"}</button><select aria-label={`تغییر وضعیت سفارش ${o.id}`} disabled={busy||transitions[o.status].length===0} className={`${field} max-w-48`} value={o.status} onChange={e=>{const after=e.target.value;if(after==="cancelled"&&!window.confirm("از لغو سفارش مطمئن هستید؟ موجودی محصولات بازگردانده می‌شود."))return;void patch({type:"status",id:o.id,status:after},"وضعیت سفارش به‌روزرسانی شد.");}}><option value={o.status}>{orderStates[o.status]?.label??o.status}</option>{transitions[o.status].map(next=><option key={next} value={next}>{orderStates[next]?.label??next}</option>)}</select></div></div>{selected===o.id&&<div className="mt-4 grid gap-4 border-t border-[#5c452f] pt-4 text-sm xl:grid-cols-2"><div className="space-y-2"><p><span className="text-[#9e8c70]">تلفن:</span> <a href={`tel:${o.recipient_phone.replace(/[^\d+]/g,"")}`} className="text-[#e8c383]">{o.recipient_phone}</a></p><p className="leading-7"><span className="text-[#9e8c70]">آدرس:</span> {o.shipping_address}</p><p>هزینه ارسال: {money(o.shipping_fee)}</p></div><div className="space-y-2">{o.items?.map((item,i)=><div key={i} className="flex items-center justify-between gap-3"><span>{item.name} × {count(item.quantity)}</span><span className="text-[#d9b47f]">{money(item.amount)}</span></div>)}</div></div>}</article>)}</div>:<Empty label="سفارشی با این مشخصات پیدا نشد."/>}
              <PageControl page={page} count={orders.length} pageSize={size} onChange={setPage}/>
            </section>}
            {active==="products"&&<>
              <section className={`${panel} p-4 sm:p-6`}><Heading title={editing?"ویرایش محصول":"افزودن یا ویرایش محصول"} caption="قیمت و موجودی مستقیماً در دیتابیس ذخیره می‌شوند"><button className={secondary} onClick={resetDraft}><Plus size={16}/> محصول جدید</button></Heading>
                <form onSubmit={saveProduct} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm text-[#d1b990]">شناسه انگلیسی<input className={`${field} mt-2`} required disabled={editing} value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value.trim().toLowerCase()})} pattern="[a-z0-9][a-z0-9-]{0,119}" placeholder="sample-product"/></label>
                  <label className="text-sm text-[#d1b990] sm:col-span-1 xl:col-span-2">نام محصول<input className={`${field} mt-2`} required maxLength={200} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
                  <label className="text-sm text-[#d1b990]">دسته‌بندی<select className={`${field} mt-2`} value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{editableCategories.map(({slug,label})=><option key={slug} value={slug}>{label}</option>)}</select></label>
                  <label className="text-sm text-[#d1b990]">برند<select className={`${field} mt-2`} value={draft.brand} onChange={e=>setDraft({...draft,brand:e.target.value})}><option value="">بدون برند</option>{brands.map(b=><option key={b.slug} value={b.slug}>{b.name}</option>)}</select></label>
                  <label className="text-sm text-[#d1b990]">قیمت (تومان)<input className={`${field} mt-2`} type="number" min="0" step="1" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="خالی = قیمت نامشخص"/></label>
                  <label className="text-sm text-[#d1b990]">موجودی<input className={`${field} mt-2`} type="number" min="0" max="1000000" step="1" required value={draft.stock} onChange={e=>setDraft({...draft,stock:e.target.value})}/></label>
                  <label className="text-sm text-[#d1b990]">تصویر محصول<input className={`${field} mt-2`} value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})} placeholder="/images/products/sample.webp"/></label>
                  <label className="text-sm text-[#d1b990] sm:col-span-2 xl:col-span-4">توضیحات<textarea className={`${field} mt-2`} rows={3} maxLength={3000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
                  <button disabled={busy} className={`${primary} sm:col-span-2 xl:col-span-4`}><CheckCircle2 size={18}/>{busy?"در حال ذخیره...":editing?"ذخیره تغییرات محصول":"ثبت محصول"}</button>
                </form><p className="mt-3 text-xs leading-6 text-[#a38e70]">فایل تصاویر باید از قبل در پوشه public/images پروژه موجود باشد. تغییر شناسه محصول پس از ساخت امکان‌پذیر نیست.</p>
              </section>
              <section className={`${panel} p-4 sm:p-6`}><Heading title="فهرست کالاها" caption="جست‌وجو، مدیریت موجودی و وضعیت انتشار"/>
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px]"><label className="relative"><Search size={18} className="absolute right-3 top-3 text-[#cba46b]"/><input className={`${field} pr-10`} placeholder="نام محصول، برند یا شناسه" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label><select className={field} value={stockFilter} onChange={e=>{setStockFilter(e.target.value);setPage(1)}}><option value="all">تمام محصولات</option><option value="low">موجودی ۵ یا کمتر</option><option value="active">فعال</option><option value="hidden">غیرفعال</option></select></div>
                <p className="mb-3 text-xs text-[#a38e70]">{count(products.length)} محصول از {count(data.products.length)} رکورد دریافت‌شده</p>
                {products.length?<div className="space-y-2">{slice(products).map(p=><div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#4f402e] bg-[#0d0b09] p-3 sm:p-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#732b38]/25 text-[#e2bd80]"><Package size={21}/></div><div className="min-w-[140px] flex-1"><b className="block truncate text-sm">{p.name}</b><p className="mt-1 text-xs text-[#a49373]">{catLabel(p.category)} · {brandLabel(p.brand)||"بدون برند"} · <code dir="ltr">{p.slug}</code></p></div><div className="text-sm font-bold text-[#e0c18d]">{money(p.priceToman)}</div><form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);void patch({type:"stock",slug:p.slug,stock:Number(form.get("stock"))},"موجودی به‌روزرسانی شد.");}} className="flex items-center gap-2"><input name="stock" aria-label={`موجودی ${p.name}`} className={`${field} w-24`} type="number" min="0" max="1000000" step="1" required key={`${p.slug}-${p.stock}`} defaultValue={p.stock}/><button className={secondary} disabled={busy}>ذخیره</button></form><button className={secondary} disabled={busy} onClick={()=>loadDraft(p)}><Pencil size={16}/> ویرایش</button><button disabled={busy} onClick={()=>void patch({type:"visibility",slug:p.slug,active:!p.active},p.active?"محصول از فروشگاه مخفی شد.":"محصول فعال شد.")} className={`min-h-10 rounded-xl border px-3 text-xs font-bold ${p.active?"border-[#776039] text-[#efd09c]":"border-[#8f4650] text-[#e7a8b0]"}`}>{p.active?"فعال / مخفی‌کردن":"غیرفعال / انتشار"}</button></div>)}</div>:<Empty label="محصولی پیدا نشد."/>}
                <PageControl page={page} count={products.length} pageSize={size} onChange={setPage}/>
              </section>
            </>}
            {active==="customers"&&<section className={`${panel} p-4 sm:p-6`}><Heading title="مدیریت مشتریان" caption="آخرین ۳۰۰ حساب کاربری؛ اطلاعات شخصی فقط برای مدیر نمایش داده می‌شود"/><label className="relative mb-5 block"><Search className="absolute right-3 top-3 text-[#cba46b]" size={18}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} className={`${field} pr-10`} placeholder="جست‌وجو با نام یا ایمیل"/></label>
              {customers.length?<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-sm"><thead className="text-xs text-[#b79f79]"><tr className="border-b border-[#5a452d]"><th className="py-3">نام کاربر</th><th>ایمیل</th><th>نقش</th><th>سفارش</th><th>ارزش سفارش</th><th>ثبت‌نام</th></tr></thead><tbody>{slice(customers).map(c=><tr key={c.id} className="border-b border-[#392d22] last:border-0"><td className="py-3 font-bold">{c.full_name||"بدون نام"}</td><td className="px-3"><bdi dir="ltr">{c.email}</bdi></td><td>{c.role==="admin"?"مدیر":"مشتری"}</td><td>{count(c.orderCount)}</td><td>{money(c.orderValue)}</td><td>{date(c.created_at)}</td></tr>)}</tbody></table></div>:<Empty label="مشتری با این مشخصات پیدا نشد."/>}
              <PageControl page={page} count={customers.length} pageSize={size} onChange={setPage}/>
              <p className="mt-4 text-xs leading-6 text-[#a18d70]">برای حفظ امنیت، تغییر نقش مدیر یا مشاهده داده‌های حساس از این صفحه مجاز نیست. ارزش سفارش به معنای پرداخت موفق نیست.</p>
            </section>}
            {active==="shipping"&&<><section className={`${panel} p-4 sm:p-6`}><Heading title="تعرفه ارسال پستی" caption="تعرفه هر شهر بر مبلغ نهایی سفارش تأثیر می‌گذارد"/><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.shipping.map(s=><div key={s.city} className="rounded-2xl border border-[#51412d] bg-[#0c0a08] p-4"><div className="flex items-center justify-between gap-2"><b>{s.city}</b><button disabled={busy} onClick={()=>void patch({type:"shippingStatus",city:s.city,active:!s.active})} className={`rounded-full border px-3 py-1 text-xs ${s.active?"border-[#b29453] text-[#e5c989]":"border-[#a6515a] text-[#efb3b9]"}`}>{s.active?"فعال":"غیرفعال"}</button></div><div className="mt-3 text-sm font-bold text-[#f0d49e]">{money(s.fee)}</div><div className="mt-1 text-xs text-[#b19c7a]">زمان تحویل: {s.days}</div></div>)}</div>
                <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void patch({type:"shipping",city:String(f.get("city")),fee:Number(f.get("fee")),days:String(f.get("days"))},"تعرفه ارسال ثبت شد.");}} className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-sm">شهر<input name="city" required maxLength={120} className={`${field} mt-2`}/></label><label className="text-sm">هزینه (تومان)<input name="fee" type="number" min="0" max="100000000" step="1" required className={`${field} mt-2`}/></label><label className="text-sm">زمان ارسال<input name="days" required maxLength={120} placeholder="۲ تا ۴ روز کاری" className={`${field} mt-2`}/></label><button disabled={busy} className={`${primary} self-end`}>ثبت یا به‌روزرسانی تعرفه</button></form>
              </section><DeliveryEditor/></>}
            {active==="support"&&<div className={`${panel} p-4 sm:p-6`}><SupportDesk admin/></div>}
          </>}
        </div>
      </div>
      <footer className="mx-auto mt-8 max-w-[1500px] border-t border-[#463527] pt-5 text-center text-xs text-[#9c8868]">MISS DOOD · پنل مدیریت محافظت‌شده · نمایش داده‌های واقعی PostgreSQL</footer>
    </div>
  </main>;
}
