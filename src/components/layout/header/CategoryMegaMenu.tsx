"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Boxes, ChevronLeft, Grid2X2, Sparkles } from "lucide-react";
import { categories, categoryBrands } from "@/data/navigation";

type CategoryKey = typeof categories[number][0];
type BrandPair = readonly [string, string];
const allBrands = categoryBrands as Record<string, readonly BrandPair[]>;

export function CategoryMegaMenu({ close }: { close: () => void }) {
  const [active, setActive] = useState<CategoryKey>("cigarettes");
  const current = categories.find(([slug]) => slug === active);
  const brands = allBrands[active] ?? [];
  return (
    <div className="w-[min(920px,calc(100vw-3rem))] overflow-hidden rounded-[26px] border border-[#8d6c3b]/70 bg-[#100d0c] shadow-[0_28px_85px_rgba(0,0,0,.74)]" dir="rtl">
      <div className="flex items-center justify-between gap-4 border-b border-[#5a4030] bg-gradient-to-l from-[#331219]/65 to-[#130f0c] px-5 py-4">
        <span className="flex items-center gap-2 text-sm font-black text-[#f2d18a]"><Sparkles size={18}/> دسته‌بندی محصولات</span>
        <Link href="/shop" onClick={close} className="flex items-center gap-2 text-xs font-bold text-[#e6c47b] hover:text-white">نمایش همه محصولات <ArrowLeft size={14}/></Link>
      </div>
      <div className="grid grid-cols-[235px_minmax(0,1fr)]">
        <div className="max-h-[min(67vh,550px)] overflow-y-auto border-l border-[#53402e] bg-[#0c0b0a] p-3" aria-label="دسته‌های اصلی">
          {categories.map(([key,label]) => <button key={key} type="button" onMouseEnter={()=>setActive(key)} onFocus={()=>setActive(key)} onClick={()=>setActive(key)} aria-pressed={active===key}
            className={`mb-1 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 text-right text-sm font-bold transition ${active===key?'border border-[#a88446] bg-gradient-to-l from-[#53242b] to-[#2a1a16] text-[#f6d99b] shadow-[inset_3px_0_0_#dcb86c]':'border border-transparent text-[#d6caba] hover:bg-[#29201c] hover:text-[#f2d18a]'}`}>
            <span>{label}</span><ChevronLeft size={16} className="shrink-0 opacity-70"/>
          </button>)}
        </div>
        <section className="max-h-[min(67vh,550px)] min-h-72 overflow-y-auto p-5" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#57412b] pb-4">
            <h3 className="flex items-center gap-2 text-lg font-black text-[#f3e4c6]"><Grid2X2 size={19} className="text-[#e8c47c]"/>{current?.[1]}</h3>
            <Link href={`/shop?category=${active}`} onClick={close} className="rounded-full border border-[#977447] bg-[#271b13] px-4 py-2 text-xs font-bold text-[#f0d18c] hover:border-[#dfb86a]">همه محصولات این دسته</Link>
          </div>
          {brands.length ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {brands.map(([slug,label]) => <Link key={slug} href={`/shop?category=${active}&brand=${encodeURIComponent(slug)}`} onClick={close} className="group flex min-h-[64px] items-center justify-between gap-2 rounded-2xl border border-[#55422c] bg-[#19150f] px-3 py-3 text-sm font-bold text-[#e6d8be] transition hover:-translate-y-0.5 hover:border-[#c79e54] hover:bg-[#381c20] hover:text-white focus-visible:outline-2 focus-visible:outline-[#e6c47b]">
              <span>{label}</span><ArrowLeft size={15} className="shrink-0 text-[#b59557] transition group-hover:-translate-x-1"/>
            </Link>)}
          </div> : <div className="grid min-h-[180px] place-items-center gap-3 rounded-2xl border border-dashed border-[#655132] p-6 text-center"><Boxes size={27} className="text-[#e6c47b]"/><p className="text-sm text-[#c9bda5]">برای دیدن محصولات این دسته وارد فروشگاه شوید.</p><Link href={`/shop?category=${active}`} onClick={close} className="text-sm font-bold text-[#e6c47b]">مشاهده محصولات</Link></div>}
        </section>
      </div>
    </div>
  );
}

export function MobileCategoryMenu({ close }: {close:()=>void}) {
  return <div className="space-y-2" dir="rtl">
    {categories.map(([key,label]) => {
      const brands=allBrands[key] ?? [];
      return <details key={key} className="group overflow-hidden rounded-xl border border-[#655035] bg-[#13100d] open:border-[#b3894a]">
        <summary className="flex min-h-12 list-none items-center justify-between gap-2 px-4 font-extrabold text-[#ecd5a3] marker:hidden [&::-webkit-details-marker]:hidden">{label}<ChevronLeft size={16} className="transition group-open:-rotate-90"/></summary>
        <div className="space-y-1 border-t border-[#493927] px-3 py-2">
          <Link href={`/shop?category=${key}`} onClick={close} className="block rounded-lg bg-[#3d2020]/65 px-3 py-3 font-bold text-[#f1cb82]">همه محصولات {label}</Link>
          {brands.map(([slug,name]) => <Link key={slug} href={`/shop?category=${key}&brand=${encodeURIComponent(slug)}`} onClick={close} className="block rounded-lg px-3 py-3 text-sm text-[#e1d4bd] hover:bg-[#321a20] hover:text-[#f0d18c]">{name}</Link>)}
        </div>
      </details>;
    })}
  </div>;
}
