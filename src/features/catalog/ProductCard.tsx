"use client";
import { ProductImageZoom } from "@/components/core/product-image-zoom";
import Link from "next/link";
import { ArrowLeft, Boxes, Sparkles } from "lucide-react";
import { productPrice, type Product } from "@/data/mock/latestProducts";
import { useStore } from "@/features/store/useStore";
import ProductQuantity from "@/features/cart/ProductQuantity";
import { FavoriteButton } from "./Favorites";
import { categories } from "@/data/navigation";
import { brands } from "@/data/brands";

type CardProduct = Product & {brand?: string};
export default function ProductCard({product,saveable=false}:{product:CardProduct;saveable?:boolean}) {
 const {stock,catalogStatus}=useStore();
 const category=categories.find(([slug])=>slug===product.category)?.[1] || "محصول";
 const brand=brands.find(b=>b.slug===product.brand)?.name;
 const available=catalogStatus==="ready"?(stock[product.slug]??0):null;
 return <article className="md-card-lux group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] text-[#f4e8d2] hover:-translate-y-1 focus-within:border-[#e6c47b]">
   <div className="relative aspect-[1.18/1] min-h-48 shrink-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(163,87,53,.19),transparent_63%),linear-gradient(155deg,#281c16,#100e0c)]">
     <div className="pointer-events-none absolute inset-6 rounded-full border border-[#a87c45]/20"/>
     <ProductImageZoom src={product.image} alt={product.name} sizes="(min-width:1350px) 330px,(min-width:1024px) 30vw,(min-width:560px) 48vw,95vw" className="p-5"/>
     <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 pointer-events-none">
       <span className="inline-flex items-center gap-1 rounded-full border border-[#86633c] bg-[#110d0c]/90 px-3 py-1.5 text-[11px] font-bold text-[#edd2a0]"><Sparkles size={12}/>{category}</span>
       {saveable&&<div className="pointer-events-auto"><FavoriteButton slug={product.slug} name={product.name}/></div>}
     </div>
     {available===0 && <span className="absolute bottom-3 right-3 rounded-full border border-[#874751] bg-[#411a21]/90 px-3 py-1 text-xs font-bold text-[#ffd4cf]">ناموجود</span>}
     {available!==null&&available>0 && <span className="absolute bottom-3 right-3 rounded-full border border-[#6b6a34] bg-[#222416]/90 px-3 py-1 text-xs font-bold text-[#e5db9c]">موجود</span>}
   </div>
   <div className="flex flex-1 flex-col gap-3 border-t border-[#5f4732] p-4 sm:p-5">
     {brand&&<span className="text-xs font-bold text-[#c6a05e]">{brand}</span>}
     <Link href={`/products/${product.slug}`} className="group/link inline-flex items-start justify-between gap-2 text-base font-black leading-7 text-[#f9edda] hover:text-[#e9c883] sm:text-lg">
       <span>{product.name}</span><ArrowLeft size={17} className="mt-1 shrink-0 text-[#a98352] transition group-hover/link:-translate-x-1"/>
     </Link>
     <p className="line-clamp-2 min-h-10 text-xs leading-6 text-[#bdae97]">{product.description || "مشاهده اطلاعات محصول و جزئیات خرید"}</p>
     <div className="mt-auto border-t border-[#483629] pt-3">
       <p className="mb-3 flex items-center gap-2 text-lg font-black tabular-nums text-[#f0cc86]"><Boxes size={17} className="text-[#b0844d]"/>{productPrice(product.priceToman)}</p>
       <ProductQuantity product={product}/>
     </div>
   </div>
 </article>;
}
