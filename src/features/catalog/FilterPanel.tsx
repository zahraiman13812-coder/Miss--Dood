"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
export default function FilterPanel({children}:{children:ReactNode}){
  const [open,setOpen]=useState(false);
  return <aside className="overflow-hidden rounded-[26px] border border-[#78542f] bg-gradient-to-br from-[#211411] via-[#15110d] to-[#0f0c0b] p-4 shadow-[0_14px_35px_rgba(0,0,0,.25)] lg:sticky lg:top-32 lg:p-5">
    <div className="hidden items-center gap-2 border-b border-[#58402e] pb-4 text-lg font-black text-[#f0d49f] lg:flex"><SlidersHorizontal size={20}/> فیلتر محصولات</div>
    <button type="button" aria-expanded={open} aria-controls="catalog-filter" onClick={()=>setOpen(!open)} className="flex min-h-12 w-full items-center gap-2 font-black text-[#f0d49f] lg:hidden"><SlidersHorizontal size={19}/> جست‌وجو و فیلترها <ChevronDown size={17} className={`ms-auto transition ${open?'rotate-180':''}`}/></button>
    <div id="catalog-filter" className={`mt-4 lg:block ${open?'block':'hidden'}`}>{children}</div>
  </aside>;
}
