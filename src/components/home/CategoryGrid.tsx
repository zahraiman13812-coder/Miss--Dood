import CatalogImage from "@/components/home/CatalogImage";
import {categoryImageSlugs} from "@/components/home/catalog-static-images";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";



export default function CategoryGrid({categories}:{categories:{slug:string;label:string;image?:string}[]}) {
  return <section aria-labelledby="category-heading" className="mx-auto w-full max-w-7xl min-w-0 px-3 pb-10 sm:px-6 sm:pb-14 xl:px-8">
    <div className="mb-5 flex items-center gap-3 sm:gap-4">
      <span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-full bg-[#9e3438]"/>
      <h2 id="category-heading" className="text-xl font-black text-content sm:text-2xl">دسته‌بندی کالاها</h2>
      <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-line"/>
    </div>
    <ul className="grid grid-cols-2 gap-2.5 min-[520px]:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {categories.map(({slug,label,image})=><li key={slug} className="min-w-0">
        <Link href={{pathname:"/shop",query:{category:slug}}} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#564629] bg-gradient-to-b from-[#1c1913] to-[#100e0a] p-2.5 transition duration-200 hover:-translate-y-1 hover:border-[#b69053] hover:shadow-[0_12px_35px_rgba(0,0,0,.3)] focus-visible:border-[#e4bf76] sm:p-4">
          <div className="relative mx-auto aspect-square w-full max-w-40 overflow-hidden rounded-xl bg-[#11100d]/60 p-2">
            <CatalogImage src={image || (categoryImageSlugs.has(slug)?`/images/categories/${slug}.webp`:undefined)} alt={label} fill sizes="(min-width: 1280px) 160px, (min-width: 640px) 25vw, 42vw" className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"/>
          </div>
          <div className="mt-auto flex min-h-12 min-w-0 items-center justify-between gap-2 border-t border-[#574629] pt-3 sm:mt-3">
            <span className="text-sm font-extrabold text-[#f4e8d2] transition group-hover:text-[#e4bf76] sm:text-base">{label}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#8d6c3f]/50 bg-[#9e3438]/10 text-[#e4bf76]"><ArrowUpLeft size={16}/></span>
          </div>
        </Link>
      </li>)}
    </ul>
  </section>;
}
