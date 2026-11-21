"use client";
import { useEffect, useState, type ReactNode } from "react";
import AdminQuickSearch from "@/components/ops/admin-quick-search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePenLine, Images, Users, Store, ShieldCheck, Menu, X, Boxes, ClipboardList, Truck, BarChart3, MessageSquare, Bell, Activity } from "lucide-react";
const links = [
  {href:"/admin",label:"داشبورد و عملیات",icon:LayoutDashboard},
  {href:"/admin/content",label:"محتوا و بنرها",icon:FilePenLine},
  {href:"/admin/media",label:"گالری تصاویر",icon:Images},
  {href:"/admin/team",label:"مدیران و دسترسی",icon:Users},
  {href:"/admin/products",label:"همه محصولات",icon:Boxes},
  {href:"/admin/products/new",label:"افزودن محصول",icon:Boxes},
  {href:"/admin/inventory",label:"گزارش انبار",icon:Boxes},
  {href:"/admin/reviews",label:"نظرات مشتریان",icon:MessageSquare},
  {href:"/admin/analytics",label:"گزارش‌های تحلیلی",icon:BarChart3},
  {href:"/admin/orders",label:"مدیریت سفارش‌ها",icon:ClipboardList},
  {href:"/admin/carts",label:"سبدهای خرید",icon:ClipboardList},
  {href:"/admin/customers",label:"مشتریان",icon:Users},
  {href:"/admin/shipping",label:"ارسال و تعرفه‌ها",icon:Truck},
  {href:"/admin/support",label:"پشتیبانی",icon:MessageSquare},
  {href:"/admin/notifications",label:"اعلان‌ها",icon:Bell},
  {href:"/admin/operations",label:"سلامت و سرعت",icon:Activity},
  {href:"/admin/drafts",label:"پیش‌نویس محتوا",icon:FilePenLine},
];
export default function AdminShell({children}:{children:ReactNode}){
 const path=usePathname();
 const [mobileOpen,setMobileOpen]=useState(false);
 const [scope,setScope]=useState("loading");
 useEffect(()=>{fetch("/api/admin/access",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.scope)setScope(d.scope)}).catch(()=>{})},[]);
 const canSee=(href:string)=>{
  if(scope==="owner")return true;
  if(href==="/admin/team"||href==="/admin/operations")return false;
  if(href==="/admin/notifications")return true;
  if(href==="/admin/drafts")return scope==="manager"||scope==="catalog";
  if(scope==="manager")return true;
  if(scope==="catalog")return ["/admin/content","/admin/media","/admin/products","/admin/products/new","/admin/reviews"].includes(href);
  if(scope==="warehouse")return href==="/admin/inventory"||href==="/admin/carts";
  if(scope==="orders")return ["/admin/orders","/admin/carts","/admin/shipping"].includes(href);
  return href==="/admin/support";
 };
 useEffect(()=>{setMobileOpen(false)},[path]);
 return <div dir="rtl" className="min-h-dvh min-w-0 bg-[#0c090a] text-[#f4e5c7] lg:flex">
   <aside className="relative z-20 border-b border-[#61452e] bg-[#160f10] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:flex lg:flex-col lg:shrink-0 lg:border-b-0 lg:border-l print:hidden">
     <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:py-5">
      <div className="min-w-0"><strong className="block text-lg tracking-wider text-[#ebc581]">MISS DOOD</strong><p className="mt-1 text-xs text-[#a68e76]">مرکز مدیریت فروشگاه</p></div>
      <div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="hidden text-[#d6ad70] lg:block"/><button type="button" className="inline-flex size-11 items-center justify-center rounded-xl border border-[#6a4936] text-[#e9c789] lg:hidden" onClick={()=>setMobileOpen(x=>!x)} aria-expanded={mobileOpen} aria-controls="admin-navigation" aria-label={mobileOpen?"بستن فهرست مدیریت":"باز کردن فهرست مدیریت"}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button></div>
     </div>
     <nav id="admin-navigation" aria-label="منوی مدیریت" className={`${mobileOpen?"grid":"hidden"} min-h-0 grid-cols-1 gap-1 overflow-y-auto overscroll-contain border-t border-[#473126] px-3 py-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-col lg:flex-nowrap lg:border-0 lg:py-2`}>
      {links.filter(x=>canSee(x.href)).map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path===href?"page":undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e5bd78] ${path===href?"bg-[#542631] text-[#ffe1aa]":"text-[#c6ae91] hover:bg-[#302024]"}`}><Icon size={18}/>{label}</Link>)}
      <Link className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#bda88a] hover:bg-[#302024] lg:hidden" href="/"><Store size={18}/> مشاهده فروشگاه</Link>
     </nav>
     <div className="hidden border-t border-[#493326] px-5 py-5 lg:block"><Link className="inline-flex items-center gap-2 text-sm text-[#bda88a] hover:text-[#ebc581]" href="/"><Store size={16}/> مشاهده فروشگاه</Link></div>
   </aside>
   <div className="min-w-0 flex-1 print:w-full"><div className="block border-b border-[#493326] px-3 py-3 sm:hidden print:hidden"><AdminQuickSearch /></div><div className="flex min-h-12 items-center justify-between border-b border-[#4c342a] px-4 py-3 sm:px-6 lg:px-8 print:hidden"><span className="text-xs text-[#c7a87c] sm:text-sm">پنل مدیریت / {links.find(x=>x.href===path)?.label??(path.startsWith("/admin/products/")?"ویرایش محصول":"مدیریت")}</span><div className="hidden min-w-0 flex-1 justify-end px-3 sm:flex"><AdminQuickSearch /></div></div><div className="min-w-0 overflow-x-clip print:overflow-visible">{children}</div></div>
 </div>
}
