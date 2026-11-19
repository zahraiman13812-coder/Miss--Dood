"use client";
import { AnimatedGroup } from "@/components/core/animated-group";
import { useState } from "react";
import { useStore, refreshCatalog } from "@/features/store/useStore";
import { brands } from "@/data/brands";
import { ProductImageZoom } from "@/components/core/product-image-zoom";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CheckCircle2, ChevronLeft, Heart, PackageSearch, RefreshCw, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { productPrice } from "@/data/mock/latestProducts";
import { productDetails } from "@/data/productDetails";
import { categories } from "@/data/navigation";
import ProductCard from "@/features/catalog/ProductCard";
import ProductQuantity from "@/features/cart/ProductQuantity";
import { FavoriteButton } from "@/features/catalog/Favorites";

const families = [["lighters","fuel","gas"],["hookah","tobacco","charcoal"],["pods","e-liquid","nic-salt"]];
export default function ProductDetail({slug}:{slug:string}){
 const {products,stock,catalogStatus}=useStore();
 const [tab,setTab]=useState<"details"|"specs">("details");
 const product=products.find(p=>p.slug===slug);
 if(!product && catalogStatus==="loading") return <main className="mx-auto max-w-6xl p-8" role="status"><div className="animate-pulse rounded-[28px] border border-[#705638] bg-[#17110e] p-10 text-center text-[#e6c47b] motion-reduce:animate-none">در حال دریافت اطلاعات محصول…</div></main>;
 if(!product && catalogStatus==="error")return <main className="mx-auto max-w-3xl space-y-5 p-8"><h1 className="text-xl font-black">ارتباط با کاتالوگ برقرار نشد</h1><button type="button" className="rounded-xl bg-[#d9b570] px-5 py-3 font-bold text-[#1a120d]" onClick={()=>void refreshCatalog(true)}><RefreshCw size={16} className="inline"/> تلاش مجدد</button></main>;
 if(!product)notFound();
 const categoryName=categories.find(([key])=>key===product.category)?.[1];
 const brand=brands.find(b=>b.slug===product.brand);
 const detail=productDetails[slug];
 const paragraphs=product.edited ? [] : detail?.paragraphs ?? [];
 const specs=product.specs || [];
 const family=families.find(group=>group.includes(product.category)) || [];
 const related=products.filter(item=>item.slug!==slug).sort((a,b)=>{
   const score=(p:typeof product)=>(p.category===product.category?4:0)+(p.brand===product.brand&&Boolean(p.brand)?2:0)+(family.includes(p.category)?1:0);
   return score(b)-score(a);
 }).slice(0,4);
 const availability=stock[slug]??0;
 return <main className="mx-auto w-full max-w-[1320px] px-3 py-6 sm:px-6 lg:px-8 lg:py-10">
   <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#c6b99e]"><Link href="/" className="hover:text-[#e6c47b]">خانه</Link><ChevronLeft size={15}/><Link href="/shop" className="hover:text-[#e6c47b]">فروشگاه</Link>{categoryName&&<><ChevronLeft size={15}/><Link href={`/shop?category=${product.category}`} className="hover:text-[#e6c47b]">{categoryName}</Link></>}<ChevronLeft size={15}/><span className="font-bold text-[#e6c47b]">{product.name}</span></nav>
   <article className="grid min-w-0 overflow-hidden rounded-[30px] border border-[#745338] bg-gradient-to-br from-[#1b1412] to-[#0e0d0c] shadow-[0_20px_55px_rgba(0,0,0,.36)] md:grid-cols-2">
     <div className="relative isolate min-h-[310px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(155,103,53,.2),transparent_62%),linear-gradient(145deg,#231514,#0d0b09)] sm:min-h-[435px]">
       <span className="absolute inset-10 rounded-[50%] border border-[#b5894b]/15" aria-hidden="true"/>
       <ProductImageZoom src={product.image} alt={product.name} priority sizes="(min-width:1300px) 600px,(min-width:768px) 50vw,95vw" className="p-7 sm:p-12"/>
       <div className="absolute right-4 top-4 rounded-full border border-[#a7834c] bg-[#180e0b]/90 px-4 py-2 text-xs font-bold text-[#f0d49b]">{categoryName || "محصول"}</div>
     </div>
     <div className="flex min-w-0 flex-col gap-5 border-t border-[#503a29] p-5 sm:p-8 md:border-r md:border-t-0 lg:p-10">
       <div className="flex items-center gap-2 text-xs font-bold tracking-[.18em] text-[#d7b26a]"><Sparkles size={16}/> MISS DOOD PRODUCT</div>
       <div className="flex items-start justify-between gap-4"><h1 className="text-2xl font-black leading-snug text-[#fff0d7] sm:text-3xl lg:text-4xl">{product.name}</h1><FavoriteButton slug={slug} name={product.name}/></div>
       {brand&&<Link href={`/shop?category=${product.category}&brand=${brand.slug}`} className="flex w-fit items-center gap-2 rounded-full border border-[#795c36] bg-[#322016] px-4 py-2 text-sm font-bold text-[#ecc98a] hover:bg-[#4d2524]">برند {brand.name}<ArrowLeft size={15}/></Link>}
       <p className="text-sm leading-8 text-[#d1c1a7]">{product.description || "برای مشاهده مشخصات و ثبت سفارش از بخش زیر استفاده کنید."}</p>
       <div className="rounded-2xl border border-[#754e37] bg-gradient-to-l from-[#331a1c]/75 to-[#1c1511] p-5">
         <p className="text-xs font-bold text-[#c6af8b]">قیمت محصول</p><p className="mt-2 text-2xl font-black tabular-nums text-[#f1cb82] sm:text-3xl">{productPrice(product.priceToman)}</p>
         <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#d4c4a6]">{availability>0?<><CheckCircle2 size={16} className="text-[#92c48b]"/> موجودی: {availability.toLocaleString("fa-IR")} عدد</>:<><PackageSearch size={16} className="text-[#d89a98]"/> فعلاً ناموجود</>}</div>
         <div className="mt-5"><ProductQuantity product={product}/></div>
       </div>
       <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold text-[#e4d0ad]"><div className="rounded-xl border border-[#65492f] bg-[#120f0c] p-3"><ShieldCheck size={20} className="mx-auto mb-2 text-[#e6c47b]"/> اطلاعات و موجودی از فروشگاه</div><div className="rounded-xl border border-[#65492f] bg-[#120f0c] p-3"><Truck size={20} className="mx-auto mb-2 text-[#e6c47b]"/> روش ارسال در تسویه‌حساب</div></div>
       <div className="mt-auto flex flex-wrap gap-3"><Link href="/cart" className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfba75] bg-[#d8b16c] px-4 font-black text-[#1c120d] hover:brightness-110"><ShoppingBag size={18}/> مشاهده سبد خرید <ArrowLeft size={17}/></Link><Link href="/shop" className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#735737] px-4 font-bold text-[#f2d18a] hover:bg-[#3a2023]">بازگشت به فروشگاه</Link></div>
     </div>
   </article>
   {(specs.length>0 || paragraphs.length>0 || product.description)&&<section className="mt-7 overflow-hidden rounded-[26px] border border-[#765638] bg-[#15110e]">
     <div role="tablist" aria-label="اطلاعات محصول" className="flex flex-wrap gap-2 border-b border-[#604630] bg-[#1b1410] p-3">
       <button type="button" role="tab" aria-selected={tab==="details"} onClick={()=>setTab("details")} className={`min-h-11 rounded-xl px-5 font-bold ${tab==="details"?'bg-[#5b2a31] text-[#fff2cf]':'text-[#c4aa82] hover:bg-[#2b1918]'}`}>توضیحات</button>
       <button type="button" role="tab" aria-selected={tab==="specs"} onClick={()=>setTab("specs")} className={`min-h-11 rounded-xl px-5 font-bold ${tab==="specs"?'bg-[#5b2a31] text-[#fff2cf]':'text-[#c4aa82] hover:bg-[#2b1918]'}`}>مشخصات فنی</button>
     </div>
     <div role="tabpanel" className="p-5 sm:p-8">
       {tab==="details"? <div className="space-y-3 text-sm leading-9 text-[#e3d5bc]">{paragraphs.length>0?paragraphs.map((text,i)=><p key={i}>{text}</p>):<p>{product.description}</p>}</div>:
       specs.length ? <dl className="divide-y divide-[#4e3b2a]">{specs.map(([label,value])=><div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 py-4 text-sm"><dt className="font-bold text-[#c4ae88]">{label}</dt><dd className="text-[#f4e8d1]">{value}</dd></div>)}</dl>:<p className="text-[#c4ae88]">مشخصات تکمیلی برای این محصول ثبت نشده است.</p>}
     </div>
   </section>}
   {related.length>0&&<section className="mt-10"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-xs font-bold tracking-widest text-[#d2a765]">DISCOVER MORE</p><h2 className="text-2xl font-black text-[#f5e5c8]">محصولات مرتبط</h2></div><Link href={`/shop?category=${product.category}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#e6c47b]">دیدن دسته <ArrowLeft size={17}/></Link></div><AnimatedGroup as="ul" preset="scale" className="grid gap-4 min-[550px]:grid-cols-2 lg:grid-cols-4">{related.map(item=><li key={item.slug}><ProductCard product={item} saveable/></li>)}</AnimatedGroup></section>}
 </main>;
}
