"use client";

import Image from "next/image";
import Link from "next/link";
import { brands as knownBrands } from "@/data/brands";
import { InfiniteSlider } from "@/components/core/infinite-slider";

export default function BrandStrip({brandList}:{brandList:{slug:string;name:string}[]}) {
  return (
    <section dir="rtl" aria-labelledby="brands-title" className="mx-auto max-w-7xl px-4 pb-12 sm:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="brands-title" className="text-xl font-bold sm:text-2xl">انتخاب بر اساس برند</h2>
        <span className="text-xs text-[#d0b587]">برای مشاهده محصولات هر برند روی آن بزنید</span>
      </div>
      <InfiniteSlider gap={12} speed={48} speedOnHover={115} className="rounded-2xl py-2">
        {brandList.map(brand => (
          <Link key={brand.slug} href={{pathname:"/shop",query:{brand:brand.slug}}}
            className="group flex w-28 shrink-0 flex-col rounded-2xl border border-[#66502e] bg-[#18130f] p-2 transition-colors hover:border-[#e4bf76] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e4bf76] sm:w-36">
            <span className="grid h-20 place-items-center overflow-hidden rounded-xl bg-[#211b17] sm:h-24">
              {knownBrands.some(b=>b.slug===brand.slug)?<Image src={`/images/brands/${brand.slug}.webp`} alt={brand.name} width={100} height={80}
                className="h-[78%] w-[80%] object-contain motion-safe:transition-transform motion-safe:group-hover:scale-105"/>:<span className="text-xs font-bold text-[#9e3438]">{brand.name}</span>}
            </span>
            <bdi className="mt-2 block truncate text-center text-sm font-semibold text-[#f3e5c6]">{brand.name}</bdi>
          </Link>
        ))}
      </InfiniteSlider>
    </section>
  );
}
