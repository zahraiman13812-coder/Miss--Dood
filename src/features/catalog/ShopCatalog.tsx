"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Search, RefreshCw, ArrowLeft, SlidersHorizontal, Sparkles, PackageSearch, X } from "lucide-react";
import { budgets } from "@/components/home/BudgetLinks";
import { useStore, refreshCatalog } from "@/features/store/useStore";
import { brands } from "@/data/brands";

import { decorProductSlugs } from "@/data/decorProducts";
import ProductCard from "@/features/catalog/ProductCard";
import FilterPanel from "@/features/catalog/FilterPanel";
import SearchSuggestions from "@/features/catalog/SearchSuggestions";
import { AnimatedGroup } from "@/components/core/animated-group";

type Params = Record<string,string|string[]|undefined>;

const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[\s\u200c]+/g," ").trim();

const select = "md-control mt-2 block text-sm";
const SIZE = 12;

export default function ShopCatalog({params,cmsCategories}:{params:Params;cmsCategories:{slug:string;label:string;brands:{slug:string;label:string}[]}[]}) {
  const categories:[string,string][] = cmsCategories.map(c=>[c.slug,c.label]);
  const departments:[string,string][] = [...categories,["decor","محصولات تزئینی"]];
  const brandByCategory:Record<string,{slug:string;name:string}[]> = Object.fromEntries(cmsCategories.map(c=>[c.slug,c.brands.map(b=>({slug:b.slug,name:b.label}))]));
  const allBrands=[...new Map(cmsCategories.flatMap(c=>c.brands).map(b=>[b.slug,{slug:b.slug,name:b.label}])).values()];
  const {products:allProducts, stock, catalogStatus} = useStore();
  const value = (key:string) => {
    const item = params[key];
    return (Array.isArray(item) ? item[0] : item)?.trim() || "";
  };
  const category = departments.find(([id]) => id === value("category"));
  const rawBrand = value("brand");
  const brand = allBrands.find(b => b.slug === rawBrand) ?? brands.find(b => b.slug === rawBrand);
  const q = value("q"), budget = budgets.find(b=>b.key===value("budget"));
  const sort = value("sort"), available = value("available") === "1";
  const minPrice = value("minPrice")?Number(value("minPrice")):null;
  const maxPrice = value("maxPrice")?Number(value("maxPrice")):null;
  const page = Math.max(1, Math.min(10000, Number.parseInt(value("page"),10) || 1));
  const tokens = normalize(q).split(" ").filter(Boolean);
  const chosenCategory = category?.[0] || "";
  const options = chosenCategory && chosenCategory!=="decor"
    ? (brandByCategory[chosenCategory] || [])
    : allBrands;
  const selectedBrandName = brand?.name || rawBrand;
  const data = allProducts.filter(product => {
    const categoryTitle = categories.find(([id])=>id===product.category)?.[1];
    const brandTitle = allBrands.find(b=>b.slug===product.brand)?.name || "";
    const matchingText = normalize([product.name,product.description,categoryTitle,brandTitle].join(" "));
    return (!category || (chosenCategory==="decor"? decorProductSlugs.has(product.slug) : product.category===chosenCategory)) &&
      (!rawBrand || product.brand===rawBrand) &&
      (!available || (stock[product.slug] || 0)>0) &&
      (!budget || (product.priceToman!==null && product.priceToman>=budget.min && product.priceToman<budget.max)) &&
      (minPrice===null||!Number.isFinite(minPrice)||(product.priceToman!==null&&product.priceToman>=minPrice)) &&
      (maxPrice===null||!Number.isFinite(maxPrice)||(product.priceToman!==null&&product.priceToman<=maxPrice)) &&
      tokens.every(token=>matchingText.includes(token));
  });
  if (sort==="low" || sort==="high") data.sort((a,b) => {
    if (a.priceToman===null) return b.priceToman===null?0:1;
    if (b.priceToman===null) return -1;
    return sort==="low"?a.priceToman-b.priceToman:b.priceToman-a.priceToman;
  });
  if(sort==="az") data.sort((a,b)=>a.name.localeCompare(b.name,"fa"));
  const pages = Math.ceil(data.length/SIZE);
  const validPage = Math.max(1, Math.min(pages || 1,page));
  const visible = data.slice((validPage-1)*SIZE,validPage*SIZE);
  const currentParams = new URLSearchParams();
  for (const key of ["category","brand","q","budget","sort","available","minPrice","maxPrice"]) if(value(key)) currentParams.set(key,value(key));
  const href = (remove?:string, nextPage?:number) => {
    const p=new URLSearchParams(currentParams);
    if(remove)p.delete(remove);
    if(nextPage && nextPage>1)p.set("page",String(nextPage));
    return `/shop${p.size?`?${p}`:""}`;
  };
  const filters = [
    ["category", category?.[1] || ""], ["brand",rawBrand?selectedBrandName:""],
    ["q",q], ["budget",budget?.label||""], ["minPrice",minPrice!==null?`از ${minPrice.toLocaleString("fa-IR")} تومان`:""], ["maxPrice",maxPrice!==null?`تا ${maxPrice.toLocaleString("fa-IR")} تومان`:""], ["available",available?"فقط موجودها":""]
  ].filter(([,label])=>Boolean(label));
  const title = rawBrand?`محصولات ${selectedBrandName}`:category?.[1] || (q?"نتایج جست‌وجو":"فروشگاه میس دود");

  return <main className="mx-auto w-full max-w-[1370px] px-3 py-6 text-content sm:px-6 lg:px-8 lg:py-9">
    <nav aria-label="مسیر صفحه" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted"><Link href="/" className="hover:text-accent">خانه</Link><span>/</span><Link href="/shop" className="hover:text-accent">فروشگاه</Link>{category&&<><span>/</span><span className="text-accent">{category[1]}</span></>}</nav>
    <section className="relative isolate overflow-hidden rounded-[30px] border border-[#805630] bg-[#120e0d] px-6 py-10 shadow-[0_15px_50px_rgba(0,0,0,.35)] sm:px-10 lg:py-12">
      <Image src="/images/hero/miss-dood-2.webp" alt="" fill priority sizes="(min-width:1370px) 1370px,100vw" className="-z-20 object-cover opacity-35"/>
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#100c0d] via-[#160d0e]/95 to-[#1d1116]/35"/>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[.25em] text-[#dbb879]"><Sparkles size={15}/> MISS DOOD COLLECTION</div>
      <h1 className="max-w-2xl text-3xl font-black leading-snug text-[#faf0dc] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-8 text-[#d4c3ae]">محصولات را بر اساس دسته، برند، قیمت و وضعیت موجودی پیدا کنید.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#af8145] bg-[#281a16] px-4 text-sm font-bold text-[#f2d18a] transition hover:bg-[#48222b]">همه محصولات <ArrowLeft size={17}/></Link>
        <Link href="/compare" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#745439] bg-black/60 px-4 text-sm font-bold text-[#f5dfb3] hover:border-[#e6c47b]">مقایسه محصولات</Link>
        <Link href="/favorites" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#745439] bg-black/60 px-4 text-sm font-bold text-[#f5dfb3] hover:border-[#e6c47b]"><Heart size={17}/> علاقه‌مندی‌های من</Link>
      </div>
    </section>
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterPanel>
        <form action="/shop" key={JSON.stringify(params)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <SearchSuggestions initial={q}/>
          <label className="block text-sm font-bold text-[#e7d1a9]">دسته‌بندی<select name="category" className={select} defaultValue={chosenCategory}><option value="">تمام دسته‌ها</option>{departments.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
          <label className="block text-sm font-bold text-[#e7d1a9]">برند<select name="brand" className={select} defaultValue={rawBrand}><option value="">تمام برندها</option>{options.map(({slug,name})=><option key={slug} value={slug}>{name}</option>)}{rawBrand&&!options.some(b=>b.slug===rawBrand)&&<option value={rawBrand}>{selectedBrandName}</option>}</select></label>
          <label className="block text-sm font-bold text-[#e7d1a9]">محدوده قیمت<select name="budget" className={select} defaultValue={budget?.key||""}><option value="">همه قیمت‌ها</option>{budgets.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-[#e7d1a9]">حداقل قیمت (تومان)<input name="minPrice" type="number" min="0" step="1000" className="md-control mt-2" defaultValue={value("minPrice")}/></label><label className="text-xs font-bold text-[#e7d1a9]">حداکثر قیمت (تومان)<input name="maxPrice" type="number" min="0" step="1000" className="md-control mt-2" defaultValue={value("maxPrice")}/></label></div><label className="block text-sm font-bold text-[#e7d1a9]">ترتیب نمایش<select name="sort" className={select} defaultValue={sort}><option value="">پیش‌فرض</option><option value="low">کمترین قیمت</option><option value="high">بیشترین قیمت</option><option value="az">نام محصول (الفبا)</option></select></label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#62482f] bg-[#17120f] px-3 text-sm font-bold text-[#f0ddb7]"><input name="available" type="checkbox" value="1" defaultChecked={available} className="size-5 accent-[#d9b570]"/> فقط کالاهای موجود</label>
          <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e4c078] bg-gradient-to-b from-[#deb974] to-[#ad8649] px-4 font-black text-[#180f0c] transition hover:brightness-110"><SlidersHorizontal size={18}/> اعمال فیلترها</button>
          <Link href="/shop" className="text-center text-xs font-bold text-[#c9b59a] underline-offset-4 hover:text-[#efce8b] hover:underline">پاک کردن همه فیلترها</Link>
        </form>
      </FilterPanel>
      <section aria-label="نتایج محصولات" aria-busy={catalogStatus==="loading"} className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#63472d] bg-[#17120f] px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-lg font-black"><PackageSearch size={21} className="text-[#e6c47b]"/> محصولات <span className="rounded-full bg-[#442126] px-3 py-1 text-sm text-[#f5dba8]">{data.length.toLocaleString("fa-IR")}</span></h2>
          <span className="text-xs text-[#c5b195]">{data.length?`نمایش ${(validPage-1)*SIZE+1} تا ${Math.min(validPage*SIZE,data.length)} از ${data.length}`:"محصولی یافت نشد"}</span>
        </div>
        {filters.length>0&&<div className="mb-5 flex flex-wrap items-center gap-2">{filters.map(([key,label])=><Link key={key} href={href(key)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#7f4d3d] bg-[#381b21]/65 px-3 text-xs font-bold text-[#f4d2ad] transition hover:border-[#d5a860]"><X size={13}/>{label}</Link>)}</div>}
        {catalogStatus==="loading"&&<p role="status" className="mb-5 rounded-2xl border border-[#6e5532] bg-[#1c160e] p-4 text-sm text-[#e8d4ad]">در حال دریافت اطلاعات به‌روز فروشگاه…</p>}
        {catalogStatus==="error"&&<div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#85424b] bg-[#261318] p-4"><p className="text-sm text-[#efd9d4]">کاتالوگ در دسترس نیست؛ قیمت و موجودی فعلاً نمایش داده نمی‌شود.</p><button type="button" onClick={()=>void refreshCatalog(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#bd9060] px-3 font-bold text-[#e6c47b]"><RefreshCw size={17}/> تلاش مجدد</button></div>}
        {catalogStatus==="ready" && (visible.length>0 ? <AnimatedGroup as="ul" preset="scale" className="grid gap-4 min-[550px]:grid-cols-2 2xl:grid-cols-3">{visible.map(product=><li key={product.slug}><ProductCard product={product} saveable/></li>)}</AnimatedGroup> : <div className="grid justify-items-center gap-4 rounded-[28px] border border-[#715139] bg-gradient-to-br from-[#24161a] to-[#110f0e] p-10 text-center"><Search size={34} className="text-[#e6c47b]"/><h3 className="text-xl font-black text-[#f5e8cc]">محصولی پیدا نشد</h3><p className="text-sm leading-7 text-[#c9b5a0]">برند، دسته‌بندی یا عبارت جست‌وجو را تغییر دهید.</p><Link href="/shop" className="rounded-xl bg-[#d9b371] px-5 py-3 font-extrabold text-[#1c120d]">نمایش همه محصولات</Link></div>)}
        {catalogStatus==="ready"&&pages>1&&<nav aria-label="صفحه‌بندی محصولات" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link aria-disabled={validPage===1} href={validPage===1?href():href(undefined,validPage-1)} className={`rounded-xl border px-4 py-3 text-sm font-bold ${validPage===1?'pointer-events-none border-[#493827] text-[#7a6c56]':'border-[#9c7949] text-[#e6c47b] hover:bg-[#3d2224]'}`}>قبلی</Link>
          <span className="rounded-xl border border-[#62482f] bg-[#201612] px-4 py-3 text-sm text-[#f6dfb2]">{validPage.toLocaleString("fa-IR")} / {pages.toLocaleString("fa-IR")}</span>
          <Link aria-disabled={validPage===pages} href={validPage===pages?href(undefined,validPage):href(undefined,validPage+1)} className={`rounded-xl border px-4 py-3 text-sm font-bold ${validPage===pages?'pointer-events-none border-[#493827] text-[#7a6c56]':'border-[#9c7949] text-[#e6c47b] hover:bg-[#3d2224]'}`}>بعدی</Link>
        </nav>}
      </section>
    </div>
  </main>;
}
