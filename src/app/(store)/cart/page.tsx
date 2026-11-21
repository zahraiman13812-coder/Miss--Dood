"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, Package, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { ShippingPicker } from "@/features/store/Shipping";
import {findShippingRule} from "@/features/store/store";
import {useEffect} from "react";
import { useStore } from "@/features/store/useStore";
import PurchaseSteps from "@/features/cart/PurchaseSteps";
import { productPrice } from "@/data/mock/latestProducts";
import { useCart, clearCart, changeQuantity } from "@/features/cart/useCart";
import { summarizeCart } from "@/features/cart/cartSummary";
import ProductQuantity from "@/features/cart/ProductQuantity";

export default function CartPage(){
 const {shipping,city,nationalPost,catalogStatus}=useStore();
 const cart=useCart();
 const cartFingerprint=JSON.stringify(cart);
 const {lines,count,total,stockIssue}=summarizeCart(cart);
 const missingProducts=Object.keys(cart).filter(slug=>!lines.some(line=>line.product.slug===slug));
 const rule=findShippingRule(shipping,city,nationalPost);
 useEffect(()=>{if(catalogStatus!=="ready")return;const timer=setTimeout(()=>{void fetch("/api/cart-snapshot",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:JSON.parse(cartFingerprint)})}).catch(()=>{})},750);return ()=>clearTimeout(timer)},[cartFingerprint,catalogStatus]);
 const canCheckout=total!==null && !stockIssue && missingProducts.length===0 && catalogStatus==="ready";
 return <main className="mx-auto w-full max-w-[1300px] space-y-6 px-3 py-7 sm:px-6 lg:px-8 lg:py-10">
   <header className="relative overflow-hidden rounded-[28px] border border-[#7a523b] bg-gradient-to-l from-[#32161e] via-[#1a1110] to-[#100e0b] p-6 sm:p-8">
     <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full border border-[#be9255]/10"/>
     <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[.2em] text-[#dfbd78]"><ShoppingBag size={15}/> MISS DOOD CART</p><h1 className="text-3xl font-black text-[#faf0dc] sm:text-4xl">سبد خرید شما</h1><p className="mt-2 text-sm text-[#d2bea7]">{count.toLocaleString("fa-IR")} کالا در سبد خرید</p></div><Link href="/shop" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#8f6a41] bg-[#1b130f] px-4 font-bold text-[#efd19b] hover:bg-[#4a2029]"><ArrowLeft size={18}/> ادامه خرید</Link></div>
   </header>
   {catalogStatus==="loading"&&<p role="status" className="rounded-2xl border border-[#8b693b] bg-[#21190f] p-5 text-sm text-[#e6c47b]">در حال دریافت قیمت و موجودی واقعی محصولات…</p>}
   {catalogStatus==="error"&&<p role="alert" className="rounded-2xl border border-[#8a3b43] bg-[#2c1519] p-5 text-sm text-[#ffcec1]">اتصال به کاتالوگ برقرار نیست؛ ثبت سفارش تا دریافت اطلاعات به‌روز ممکن نیست.</p>}
   {catalogStatus==="ready" && count>0 && <PurchaseSteps current={0}/>} 
   {catalogStatus==="ready" && (count===0 && missingProducts.length===0 ? <div className="grid justify-items-center gap-5 rounded-[30px] border border-[#71512f] bg-gradient-to-br from-[#25171b] to-[#11100e] px-4 py-16 text-center"><span className="grid size-20 place-items-center rounded-full border border-[#a47b45] bg-[#d6b272]/10"><ShoppingBag size={34} className="text-[#edce8b]"/></span><h2 className="text-2xl font-black text-[#f7e9d1]">سبد خرید شما خالی است</h2><p className="text-sm text-[#bfad95]">برای انتخاب محصولات به فروشگاه سر بزنید.</p><Link href="/shop" className="rounded-xl bg-[#d7b16f] px-6 py-3 font-bold text-[#20130d]">مشاهده محصولات</Link></div> :
   <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
     <section aria-label="محصولات سبد" className="min-w-0 space-y-4">
       <div className="flex flex-wrap items-center justify-between gap-3 px-1"><h2 className="text-xl font-black text-[#f4e0b7]">محصولات انتخاب‌شده</h2><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#804044] bg-[#31171a]/75 px-3 text-sm font-bold text-[#f1bcb7] hover:border-[#c76f70]" onClick={()=>{if(window.confirm("همه کالاهای سبد خرید حذف شوند؟"))clearCart();}}><Trash2 size={16}/> پاک‌کردن سبد</button></div>
       {missingProducts.length>0&&<div className="rounded-2xl border border-[#8d424b] bg-[#30171b] p-4 text-sm text-[#f3d3c9]"><p className="mb-3 font-bold">بعضی محصولات دیگر در کاتالوگ موجود نیستند.</p><button type="button" className="rounded-lg border border-[#be797c] px-4 py-2" onClick={()=>missingProducts.forEach(slug=>changeQuantity(slug,-cart[slug]))}>حذف کالاهای نامعتبر از سبد</button></div>}
       {lines.map(({product,quantity,amount})=><article key={product.slug} className="md-card-lux grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl p-4 sm:grid-cols-[116px_minmax(0,1fr)_175px] sm:items-center sm:gap-5 sm:p-5">
         <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden rounded-2xl border border-[#684c36] bg-[radial-gradient(circle,#382521,#16100f)]"><Image fill sizes="116px" src={product.image} alt={product.name} className="object-contain p-2"/></Link>
         <div className="min-w-0 space-y-2"><Link href={`/products/${product.slug}`} className="text-base font-black leading-7 text-[#f7e9d0] hover:text-[#e6c47b]">{product.name}</Link><p className="text-xs text-[#c0b19a]">قیمت واحد: {productPrice(product.priceToman)}</p><p className="text-sm font-extrabold text-[#e6c47b]">جمع: {productPrice(amount)}</p></div>
         <div className="col-span-2 sm:col-span-1"><ProductQuantity product={product}/></div>
       </article>)}
       <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#5b4231] bg-[#1a1411] p-4 text-xs text-[#ccb99d]"><ShieldCheck size={18} className="text-[#edce8b]"/> قیمت‌ها و موجودی پیش از ثبت نهایی سفارش از سرور بررسی می‌شوند.</div>
     </section>
     <aside aria-label="خلاصه سفارش" className="md-ember-glow rounded-[26px] border border-[#956b43] bg-gradient-to-br from-[#281715] via-[#16110e] to-[#0d0d0b] p-5 lg:sticky lg:top-32 lg:p-6">
       <div className="mb-5 flex items-center gap-2 border-b border-[#6f4b33] pb-4 text-xl font-black text-[#f5e1b8]"><Package size={22} className="text-[#e8c47d]"/> خلاصه سفارش</div>
       <dl className="space-y-4 text-sm"><div className="flex items-center justify-between gap-3 text-[#d4c6ac]"><dt>تعداد محصولات</dt><dd>{count.toLocaleString("fa-IR")} عدد</dd></div><div className="flex flex-wrap items-center justify-between gap-3 text-[#d4c6ac]"><dt>جمع کالاها</dt><dd className="font-black text-[#f4dfba]">{productPrice(total)}</dd></div></dl>
       {total!==null&&<ShippingPicker subtotal={total}/>} 
       <div className="mt-5 space-y-3 border-t border-[#6e4d31] pt-5">
         <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-black text-[#f4e6ce]"><span>مجموع تقریبی با ارسال</span><strong className="text-lg text-[#e9c47f]">{rule&&total!==null?productPrice(total+rule.fee):"پس از انتخاب مقصد"}</strong></div>
         {canCheckout?<Link href="/checkout" className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-[#e1c17d] bg-gradient-to-b from-[#dec184] to-[#af8647] px-4 text-center font-black text-[#1e120d] transition hover:brightness-110"><Truck size={19}/> ادامه ثبت سفارش <ArrowLeft size={18}/></Link>:
         <p role="status" className="rounded-xl border border-[#844950] bg-[#33171c]/60 p-3 text-sm leading-7 text-[#ead2c5]">{stockIssue?"موجودی بعضی کالاها کافی نیست؛ تعداد را اصلاح کنید.":missingProducts.length?"محصولات نامعتبر را از سبد حذف کنید.":total===null?"قیمت بعضی کالاها هنوز ثبت نشده است.":"برای ادامه، شهر و روش ارسال مجاز را مشخص کنید."}</p>}
       </div>
       <div className="mt-5 flex items-center gap-2 text-xs text-[#bea987]"><Gift size={16} className="text-[#e6c47b]"/> جزئیات نهایی ارسال هنگام تسویه‌حساب مشخص می‌شود.</div>
     </aside>
   </div>)}
 </main>;
}
