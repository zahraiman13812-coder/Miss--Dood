"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { MapPin, PackageCheck, Store, Truck, Zap } from "lucide-react";
import PurchaseSteps from "@/features/cart/PurchaseSteps";
import { useStore } from "@/features/store/useStore";
import { updateStore } from "@/features/store/store";
import { useCart, changeQuantity } from "@/features/cart/useCart";
import { summarizeCart } from "@/features/cart/cartSummary";
import { productPrice } from "@/data/mock/latestProducts";
import LocationPicker, {type Coordinates} from "@/features/account/LocationPicker";
import {storeContact as defaultContact} from "@/data/storeContact";

type DeliveryMethod = "pickup" | "express" | "post";
type Address = { id:string; title:string; recipient_name:string;phone:string;city:string;province:string;building:string;unit:string;address:string;postal_code:string;latitude:number|null;longitude:number|null;preferred_shipping_method?:DeliveryMethod };
type ShippingSettings = {pickup:{active:boolean;fee:number};express:{active:boolean;fee:number|null};post:{active:boolean;fee:number|null}};
const input = "mt-2 min-h-12 w-full rounded-xl border border-[#755b32] bg-[#0c0a08] px-4 py-3 text-[#fff0d5] outline-none focus:border-[#d7b875] focus:ring-2 focus:ring-[#d7b875]/25";
const panel = "rounded-[24px] border border-[#70562e] bg-[#15110d] p-5 shadow-xl sm:p-7";
const gold = "min-h-12 rounded-xl border border-[#e8ce8d] bg-gradient-to-b from-[#d7b777] to-[#a78347] px-6 py-3 font-black text-[#181007] disabled:opacity-50";
const methods: {id:DeliveryMethod;label:string;caption:string;icon:typeof Truck}[] = [
  {id:"pickup",label:"تحویل حضوری (تهران)",caption:"دریافت از محل فروشگاه، بدون هزینه ارسال",icon:Store},
  {id:"express",label:"ارسال اکسپرس تهران",caption:"ارسال سریع؛ تعرفه باید توسط فروشگاه فعال شده باشد",icon:Zap},
  {id:"post",label:"ارسال پستی",caption:"تهران و شهرستان‌ها، طبق تعرفه شهر",icon:Truck},
];
export default function CheckoutPage() {
  const [pickupAddress,setPickupAddress]=useState(defaultContact.address);
  useEffect(()=>{fetch("/api/site-content").then(r=>r.ok?r.json():null).then(v=>{if(typeof v?.contact?.address==="string")setPickupAddress(v.contact.address)}).catch(()=>{});},[]);
  const cart = useCart();
  const {shipping,city,catalogStatus} = useStore();
  const {lines,count,total,stockIssue} = summarizeCart(cart);
  const [method,setMethod] = useState<DeliveryMethod>("post");
  const [recipient,setRecipient] = useState({name:"",phone:"",province:"",building:"",unit:"",address:"",postalCode:""});
  const [coords,setCoords] = useState<Coordinates|null>(null);
  const [savedAddresses,setSavedAddresses] = useState<Address[]>([]);
  const [settings,setSettings] = useState<ShippingSettings|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [review,setReview] = useState(false);
  const [receipt,setReceipt] = useState("");
  const requestId = useRef<string|null>(null);
  const lock=useRef(false);
  useEffect(()=> {
    let active=true;
    Promise.allSettled([fetch("/api/account/addresses",{cache:"no-store"}),fetch("/api/delivery",{cache:"no-store"})]).then(async results => {
      if(results[0].status==="fulfilled" && results[0].value.ok) {
        const data=await results[0].value.json();if(active && Array.isArray(data.addresses))setSavedAddresses(data.addresses);
      }
      if(results[1].status==="fulfilled" && results[1].value.ok) {
        const data=await results[1].value.json();if(active)setSettings(data);
      }
    }).catch(()=>{});
    return ()=>{active=false;};
  },[]);
  const selectedCity = method === "post" ? city : "تهران";
  const postalRule = shipping.find(rule=>rule.city===selectedCity);
  const shippingFee = method === "pickup" ? 0 : method === "express" && settings?.express?.active ? settings.express.fee : method === "post" ? postalRule?.fee : null;
  const canCheckout = catalogStatus==="ready" && !!count && !stockIssue && total!==null && shippingFee!==undefined && shippingFee!==null && Number.isSafeInteger(total+shippingFee);
  const signature = JSON.stringify({cart,recipient,coords,selectedCity,method});
  const previousSignature = useRef(signature);
  useEffect(()=>{if(previousSignature.current!==signature){previousSignature.current=signature;requestId.current=null;}},[signature]);
  function applySavedAddress(id:string){
    const found=savedAddresses.find(a=>a.id===id); if(!found)return;
    setRecipient({name:found.recipient_name,phone:found.phone,province:found.province||"",building:found.building||"",unit:found.unit||"",address:found.address,postalCode:found.postal_code||""});
    setCoords(found.latitude!=null&&found.longitude!=null?{lat:found.latitude,lng:found.longitude}:null);
    if(found.preferred_shipping_method && (found.preferred_shipping_method==="post" || found.city==="تهران"))setMethod(found.preferred_shipping_method);
    if(shipping.some(rule=>rule.city===found.city))updateStore(old=>({...old,city:found.city}));
    else setError("این شهر فعلاً در فهرست ارسال پستی موجود نیست؛ شهر را از فهرست انتخاب کنید.");
  }
  const validPhone = /^\+?[0-9۰-۹٠-٩ \-]{8,22}$/.test(recipient.phone.trim());
  const postalCode = recipient.postalCode.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
  function validate() {
    if(recipient.name.trim().length < 2 || !validPhone) return "نام کامل و شماره تماس معتبر وارد کنید.";
    if(method!=="pickup" && (recipient.address.trim().length<6 || !recipient.province.trim() || !recipient.building.trim() || !/^\d{10}$/.test(postalCode)))return "آدرس کامل و کد پستی ۱۰ رقمی الزامی است.";
    if(method==="express" && !coords)return "برای اکسپرس، موقعیت دقیق را روی نقشه انتخاب کنید.";
    if(!canCheckout)return "تعرفه انتخاب‌شده فعال نیست یا سبد خرید/شهر را بررسی کنید.";
    return "";
  }
  function proceed(event:FormEvent<HTMLFormElement>){event.preventDefault();const problem=validate();setError(problem);if(!problem)setReview(true);}
  async function submit(){
    if(lock.current)return;
    const problem=validate();if(problem){setError(problem);return;}
    lock.current=true;setBusy(true);setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":requestId.current},body:JSON.stringify({recipientName:recipient.name,recipientPhone:recipient.phone,shippingAddress:method==="pickup"?"":recipient.address,shippingCity:selectedCity,shippingProvince:method==="pickup"?"تهران":recipient.province,building:method==="pickup"?"":recipient.building,unit:method==="pickup"?"":recipient.unit,postalCode:method==="pickup"?"":postalCode,latitude:coords?.lat??null,longitude:coords?.lng??null,shippingMethod:method,items:lines.map(l=>({slug:l.product.slug,quantity:l.quantity}))})});
      const data=await response.json();
      if(!response.ok){const messages:Record<string,string>={AUTH_REQUIRED:"برای سفارش وارد حساب شوید.",EXPRESS_UNAVAILABLE:"ارسال اکسپرس فعلاً فعال نیست.",INVALID_SHIPPING_CITY:"برای شهر انتخاب‌شده تعرفه وجود ندارد.",INVALID_POSTAL_CODE:"کد پستی معتبر نیست.",LOCATION_REQUIRED:"موقعیت روی نقشه را انتخاب کنید.",INSUFFICIENT_STOCK:"موجودی کالا کافی نیست.",PRODUCT_UNAVAILABLE:"یک محصول دیگر موجود نیست."};throw Error(messages[data.error]||"ثبت سفارش ناموفق بود.");}
      setReceipt(data.orderId);
      for(const [slug,qty] of Object.entries(cart))changeQuantity(slug,-qty);
    }catch(e){setError(e instanceof Error?e.message:"خطا در اتصال به سرور");}finally{lock.current=false;setBusy(false);}
  }
  if(receipt)return <main className="mx-auto w-full max-w-2xl space-y-4 p-6"><PurchaseSteps current={3}/><div className={panel}><PackageCheck size={38} className="text-[#ecc87d]"/><h1 className="mt-3 text-2xl font-black text-[#f0d08d]">سفارش ثبت شد</h1><p className="mt-3 break-all">شناسه سفارش: <bdi>{receipt}</bdi></p><p className="mt-3 text-sm text-[#cdbb96]">پرداخت آنلاین فعال نیست؛ ثبت سفارش رسید پرداخت محسوب نمی‌شود.</p><Link className="mt-4 inline-block text-[#e8c477]" href="/orders">پیگیری سفارش</Link></div></main>;
  return <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 text-[#f5ead4]"><PurchaseSteps current={review?2:1}/><h1 className="text-2xl font-black">{review?"مرور نهایی سفارش":"مشخصات گیرنده و روش تحویل"}</h1>
    {catalogStatus !== "ready"?<div className={panel}>در حال بارگذاری اطلاعات کالا یا خطا در اتصال به کاتالوگ…</div>:
    !count||stockIssue||total===null?<div className={panel}>سبد خرید را بررسی کنید. <Link href="/cart" className="text-[#e7c47c]">بازگشت</Link></div>:
    review?<section className={`${panel} space-y-4`}><h2 className="text-xl font-bold">خلاصه سفارش</h2><p>{recipient.name} — <bdi dir="ltr">{recipient.phone}</bdi></p><p>{recipient.province||"تهران"}، {selectedCity}، {method==="pickup"?pickupAddress:recipient.address} {recipient.building&&`، پلاک ${recipient.building}`} {recipient.unit&&`، واحد ${recipient.unit}`}</p>{method!=="pickup"&&<p>کد پستی: {postalCode}</p>}
      <p className="text-[#e8c477]">روش تحویل: {methods.find(m=>m.id===method)?.label}</p>
      {lines.map(l=><div key={l.product.slug} className="flex justify-between gap-4 border-b border-[#56462d] pb-2 text-sm"><span>{l.product.name} × {l.quantity}</span><span>{productPrice(l.amount)}</span></div>)}
      <p>جمع کالاها: {productPrice(total)}</p><p>هزینه ارسال: {productPrice(shippingFee??0)}</p><p className="text-lg font-bold text-[#e8c477]">مبلغ کل: {productPrice(total+(shippingFee??0))}</p>
      {error&&<p role="alert" className="text-red-300">{error}</p>}
      <button type="button" onClick={submit} disabled={busy} className={`${gold} w-full`}>{busy?"در حال ثبت":"ثبت قطعی سفارش"}</button>
      <button type="button" onClick={()=>setReview(false)} className="w-full rounded-xl border border-[#795f36] p-3 text-[#e7c47c]">بازگشت و ویرایش</button>
    </section>:
    <form className={`${panel} space-y-5`} onSubmit={proceed}>
      <section className="space-y-3"><h2 className="text-lg font-bold text-[#e8c477]">۱. روش تحویل</h2>
        <div className="grid gap-3 sm:grid-cols-3">{methods.map(({id,label,caption,icon:Icon})=>{
          const disabled=id==="express" && !settings?.express.active;
          return <label key={id} className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 ${method===id?"border-[#e3c17b] bg-[#42301c]":"border-[#69502c] bg-[#0b0907]"} ${disabled?"cursor-not-allowed opacity-55":""}`}>
            <input type="radio" name="deliveryMethod" value={id} checked={method===id} disabled={disabled} onChange={()=>{setMethod(id);setReview(false);setError("");}} className="sr-only"/>
            <Icon size={22} className="text-[#e9c47c]"/><span className="font-black">{label}</span><span className="text-xs leading-6 text-[#c9b89a]">{caption}</span>
          </label>;
        })}</div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2"><h2 className="text-lg font-bold text-[#e8c477] sm:col-span-2">۲. مشخصات دریافت‌کننده</h2>
        {savedAddresses.length>0 && method!=="pickup" && <label className="sm:col-span-2">آدرس ذخیره‌شده<select className={input} defaultValue="" onChange={e=>applySavedAddress(e.target.value)}><option value="">ورود دستی</option>{savedAddresses.map(a=><option key={a.id} value={a.id}>{a.title} — {a.city}</option>)}</select></label>}
        <label>نام و نام خانوادگی<input required autoComplete="name" maxLength={120} className={input} value={recipient.name} onChange={e=>setRecipient(old=>({...old,name:e.target.value}))}/></label>
        <label>شماره تماس<input required type="tel" dir="ltr" autoComplete="tel" maxLength={22} className={input} value={recipient.phone} onChange={e=>setRecipient(old=>({...old,phone:e.target.value}))}/></label>
        {method!=="pickup" && <><label>استان<input required maxLength={80} className={input} value={recipient.province} onChange={e=>setRecipient(old=>({...old,province:e.target.value}))} placeholder="مثلاً تهران"/></label><label>شهر ارسال<select required className={input} value={city} onChange={e=>updateStore(old=>({...old,city:e.target.value}))}><option value="">انتخاب شهر</option>{shipping.map(r=><option key={r.city} value={r.city}>{r.city}</option>)}</select></label>
          <label>کد پستی ۱۰ رقمی<input required dir="ltr" inputMode="numeric" maxLength={10} className={input} value={recipient.postalCode} onChange={e=>setRecipient(old=>({...old,postalCode:e.target.value}))}/></label>
          <label>پلاک / ساختمان<input required maxLength={40} className={input} value={recipient.building} onChange={e=>setRecipient(old=>({...old,building:e.target.value}))}/></label>
          <label>واحد<input maxLength={40} className={input} value={recipient.unit} onChange={e=>setRecipient(old=>({...old,unit:e.target.value}))}/></label>
          <label className="sm:col-span-2">نشانی کامل<textarea required rows={3} minLength={6} maxLength={1000} autoComplete="street-address" className={input} value={recipient.address} onChange={e=>setRecipient(old=>({...old,address:e.target.value}))}/></label>
          <div className="sm:col-span-2"><LocationPicker city={selectedCity} value={coords} onChange={setCoords} label={method==="express"?"موقعیت دقیق برای ارسال اکسپرس (الزامی)":"انتخاب موقعیت روی نقشه (اختیاری برای پست)"}/></div>
        </>}
        {method==="pickup" && <div className="sm:col-span-2 rounded-xl border border-[#7e663b] bg-[#0b0907] p-4 text-sm leading-7"><MapPin className="inline text-[#e8c477]" size={18}/> دریافت حضوری از: {pickupAddress}</div>}
      </section>
      <section className="space-y-2 border-t border-[#604b2b] pt-4"><h2 className="text-lg font-bold text-[#e8c477]">۳. هزینه سفارش</h2><p>جمع کالاها: {productPrice(total)}</p><p>هزینه تحویل: {shippingFee==null?"هنوز قابل محاسبه نیست":productPrice(shippingFee)}</p>{shippingFee!=null&&<strong className="block text-lg text-[#eac781]">مجموع: {productPrice(total+shippingFee)}</strong>}</section>
      {error&&<p role="alert" className="rounded-xl border border-[#9f373c] bg-[#451d23] p-3 text-sm text-red-200">{error}</p>}
      <button className={`${gold} w-full`} disabled={!canCheckout}>مرور و ثبت سفارش</button>
    </form>}
  </main>;
}
