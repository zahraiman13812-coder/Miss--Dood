"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePenLine, Images, Users, Store, ShieldCheck, Menu, X, Boxes, ClipboardList, BarChart3, MessageSquare } from "lucide-react";
const links = [
  {href:"/admin",label:"داشبورد و عملیات",icon:LayoutDashboard},
  {href:"/admin/content",label:"محتوا و بنرها",icon:FilePenLine},
  {href:"/admin/media",label:"گالری تصاویر",icon:Images},
  {href:"/admin/team",label:"مدیران و دسترسی",icon:Users},
  {href:"/admin/products",label:"مدیریت محصولات",icon:Boxes},
  {href:"/admin/product-images",label:"تصاویر محصولات",icon:Images},
  {href:"/admin/product-specs",label:"مشخصات فنی محصولات",icon:Boxes},
  {href:"/admin/inventory",label:"گزارش انبار",icon:Boxes},
  {href:"/admin/reviews",label:"نظرات مشتریان",icon:MessageSquare},
  {href:"/admin/analytics",label:"گزارش‌های تحلیلی",icon:BarChart3},
  {href:"/admin/orders",label:"مدیریت سفارش‌ها",icon:ClipboardList},
  {href:"/admin/support",label:"پشتیبانی",icon:MessageSquare},
];
export default function AdminShell({children}:{children:ReactNode}){
 const path=usePathname();
 const [mobileOpen,setMobileOpen]=useState(false);
 const [scope,setScope]=useState("loading");
 useEffect(()=>{fetch("/api/admin/access",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.scope)setScope(d.scope)}).catch(()=>{})},[]);
 const canSee=(href:string)=>{
  if(scope==="owner")return true;
  if(href==="/admin/team")return false;
  if(scope==="manager")return true;
  if(scope==="catalog")return ["/admin/content","/admin/media","/admin/products","/admin/product-images","/admin/product-specs","/admin/reviews"].includes(href);
  if(scope==="warehouse")return href==="/admin/inventory";
  if(scope==="orders")return href==="/admin/orders";
  return href==="/admin/support";
 };
 useEffect(()=>{setMobileOpen(false)},[path]);
 return <div dir="rtl" className="min-h-dvh min-w-0 bg-[#0c090a] text-[#f4e5c7] lg:flex">
   <aside className="relative z-20 border-b border-[#61452e] bg-[#160f10] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-l">
     <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:py-5">
      <div className="min-w-0"><strong className="block text-lg tracking-wider text-[#ebc581]">MISS DOOD</strong><p className="mt-1 text-xs text-[#a68e76]">مرکز مدیریت فروشگاه</p></div>
      <div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="hidden text-[#d6ad70] lg:block"/><button type="button" className="inline-flex size-11 items-center justify-center rounded-xl border border-[#6a4936] text-[#e9c789] lg:hidden" onClick={()=>setMobileOpen(x=>!x)} aria-expanded={mobileOpen} aria-controls="admin-navigation" aria-label={mobileOpen?"بستن فهرست مدیریت":"باز کردن فهرست مدیریت"}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button></div>
     </div>
     <nav id="admin-navigation" aria-label="منوی مدیریت" className={`${mobileOpen?"grid":"hidden"} grid-cols-1 gap-1 border-t border-[#473126] px-3 py-3 sm:grid-cols-2 lg:flex lg:flex-col lg:border-0 lg:py-2`}>
      {links.filter(x=>canSee(x.href)).map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path===href?"page":undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e5bd78] ${path===href?"bg-[#542631] text-[#ffe1aa]":"text-[#c6ae91] hover:bg-[#302024]"}`}><Icon size={18}/>{label}</Link>)}
      <Link className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#bda88a] hover:bg-[#302024] lg:hidden" href="/"><Store size={18}/> مشاهده فروشگاه</Link>
     </nav>
     <div className="hidden border-t border-[#493326] px-5 py-5 lg:block"><Link className="inline-flex items-center gap-2 text-sm text-[#bda88a] hover:text-[#ebc581]" href="/"><Store size={16}/> مشاهده فروشگاه</Link></div>
   </aside>
   <div className="min-w-0 flex-1"><div className="flex min-h-12 items-center justify-between border-b border-[#4c342a] px-4 py-3 sm:px-6 lg:px-8"><span className="text-xs text-[#c7a87c] sm:text-sm">پنل مدیریت / {links.find(x=>x.href===path)?.label??"مدیریت"}</span><span className="hidden text-xs text-[#967b5d] sm:inline">نسخه مدیریتی</span></div><div className="min-w-0 overflow-x-clip">{children}</div></div>
 </div>
}
