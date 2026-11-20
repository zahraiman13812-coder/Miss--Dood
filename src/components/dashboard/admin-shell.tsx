"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FilePenLine, Images, Users, ShoppingBag, Store, ShieldCheck } from "lucide-react";
const links=[
{href:"/admin",label:"داشبورد و عملیات",icon:LayoutDashboard},
{href:"/admin/content",label:"محتوا و بنرها",icon:FilePenLine},
{href:"/admin/media",label:"گالری تصاویر",icon:Images},
{href:"/admin/team",label:"مدیران و دسترسی",icon:Users},
];
export default function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div dir="rtl" className="min-h-dvh bg-[#0c090a] text-[#f4e5c7] lg:flex">
  <aside className="border-b border-[#61452e] bg-[#160f10] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-l">
   <div className="flex items-center justify-between px-5 py-5"><div><strong className="text-lg tracking-wider text-[#ebc581]">MISS DOOD</strong><p className="mt-1 text-xs text-[#a68e76]">مرکز مدیریت فروشگاه</p></div><ShieldCheck className="text-[#d6ad70]"/></div>
   <nav aria-label="منوی مدیریت" className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path===href?"page":undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${path===href?"bg-[#542631] text-[#ffe1aa]":"text-[#c6ae91] hover:bg-[#302024]"}`}><Icon size={18}/>{label}</Link>)}</nav>
   <div className="hidden border-t border-[#493326] px-5 py-5 lg:block"><Link className="inline-flex items-center gap-2 text-sm text-[#bda88a] hover:text-[#ebc581]" href="/"><Store size={16}/> مشاهده فروشگاه</Link></div>
  </aside>
  <div className="min-w-0 flex-1"><div className="flex items-center justify-between border-b border-[#4c342a] px-4 py-3 sm:px-8"><span className="text-sm text-[#c7a87c]">پنل مدیریت / {links.find(x=>x.href===path)?.label??"مدیریت"}</span><Link href="/" className="inline-flex items-center gap-2 text-sm text-[#e4be7b] lg:hidden"><Store size={16}/> فروشگاه</Link></div>{children}</div>
 </div>
}
