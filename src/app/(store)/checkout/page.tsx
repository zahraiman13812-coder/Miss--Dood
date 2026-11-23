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
import {IranCitySelect} from "@/features/store/IranCitySelect";
import {findShippingRule} from "@/features/store/store";
import {postalDigits} from "@/lib/postal-code";

type DeliveryMethod = string;
type DynamicRate={key:string;label:string;fee:number;days:string};
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
  const {shipping,city,nationalPost,catalogStatus} = useStore();
  const {lines,count,total,stockIssue} = summarizeCart(cart);
  const [method,setMethod] = useState<DeliveryMethod>("post");
  const [recipient,setRecipient] = useState({name:"",phone:"",province:"",building:"",unit:"",address:"",street:"",postalCode:""});
  const [coords,setCoords] = useState<Coordinates|null>(null);
  const [savedAddresses,setSavedAddresses] = useState<Address[]>([]);
  const [settings,setSettings] = useState<ShippingSettings|null>(null);
  const [dynamicRates,setDynamicRates]=useState<DynamicRate[]>([]);
  const [loadingRates,setLoadingRates]=useState(false);
  const [ratesLoaded,setRatesLoaded]=useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [review,setReview] = useState(false);
  const [receipt,setReceipt] = useState("");
  const [demoResult,setDemoResult]=useState<string>("");
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
  useEffect(()=>{
    if(!city||!recipient.province){setDynamicRates([]);setRatesLoaded(false);return;}
    let alive=true;setLoadingRates(true);setRatesLoaded(false);
    const q=new URLSearchParams({province:recipient.province,city});
    fetch(`/api/shipping-options?${q}`,{cache:"no-store"}).then(async res=>{if(!res.ok)throw Error("RATES_UNAVAILABLE");return res.json()}).then(d=>{if(alive){setDynamicRates(Array.isArray(d.options)?d.options:[]);setRatesLoaded(true)}}).catch(()=>{if(alive){setDynamicRates([]);setRatesLoaded(false)}}).finally(()=>{if(alive)setLoadingRates(false)});
    return ()=>{alive=false};
  },[city,recipient.province]);
  const selectedCity = method==="pickup" && !city ? "تهران" : city;
  const chosenRate=dynamicRates.find(r=>r.key===method);
  const ratesAvailable=dynamicRates.length>0;
  const methodItems=ratesAvailable ? dynamicRates.filter(r=>["post","express","pickup"].includes(r.key)).map(r=>({id:r.key,label:r.label,caption:`${r.days} · ${productPrice(r.fee)}`,icon:r.key==="pickup"?Store:r.key==="express"?Zap:Truck})) : methods;

  const postalRule = findShippingRule(shipping,selectedCity,nationalPost);
  const shippingFee = ratesAvailable ? chosenRate?.fee ?? null : method === "pickup" ? 0 : method === "express" && settings?.express?.active ? settings.express.fee : method === "post" ? postalRule?.fee : null;
  const canCheckout = catalogStatus==="ready" && !!count && !stockIssue && total!==null && !loadingRates && (ratesAvailable ? !!chosenRate : !city || !recipient.province ? method==="pickup" : ratesLoaded) && shippingFee!==undefined && shippingFee!==null && Number.isSafeInteger(total+shippingFee);
  const signature = JSON.stringify({cart,recipient,coords,selectedCity,method,shippingFee});
  const previousSignature = useRef(signature);
  useEffect(()=>{if(previousSignature.current!==signature){previousSignature.current=signature;requestId.current=null;}},[signature]);
  function applySavedAddress(id:string){
    const found=savedAddresses.find(a=>a.id===id); if(!found)return;
    setRecipient({name:found.recipient_name,phone:found.phone,province:found.province||"",building:found.building||"",unit:found.unit||"",address:found.address,street:found.address,postalCode:found.postal_code||""});
    setCoords(found.latitude!=null&&found.longitude!=null?{lat:found.latitude,lng:found.longitude}:null);
    if(found.preferred_shipping_method && (found.preferred_shipping_method==="post" || found.city==="تهران"))setMethod(found.preferred_shipping_method);
    updateStore(old=>({...old,city:found.city}));
  }
  const validPhone = /^\+?[0-9۰-۹٠-٩ \-]{8,22}$/.test(recipient.phone.trim());
  // Saved addresses contain one combined address; don't require customers to
  // retype the street or serialize it twice into a new order.
  const shippingAddressText = recipient.street.trim() === recipient.address.trim()
    ? recipient.address.trim()
    : `${recipient.street.trim()}، ${recipient.address.trim()}`;
  const postalCode = postalDigits(recipient.postalCode);
  function validate() {
    if(recipient.name.trim().length < 2 || !validPhone) return "نام کامل و شماره تماس معتبر وارد کنید.";
    if(method!=="pickup" && (recipient.address.trim().length<6 || recipient.street.trim().length<3 || !recipient.province.trim() || !recipient.building.trim() || !/^\d{10}$/.test(postalCode)))return "آدرس کامل و کد پستی ۱۰ رقمی الزامی است.";
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
      const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":requestId.current},body:JSON.stringify({recipientName:recipient.name,recipientPhone:recipient.phone,shippingAddress:method==="pickup"?"":shippingAddressText,shippingCity:selectedCity,shippingProvince:method==="pickup"?"تهران":recipient.province,building:method==="pickup"?"":recipient.building,unit:method==="pickup"?"":recipient.unit,postalCode:method==="pickup"?"":postalCode,latitude:coords?.lat??null,longitude:coords?.lng??null,shippingMethod:method,items:lines.map(l=>({slug:l.product.slug,quantity:l.quantity}))})});
      const data=await response.json();
      if(!response.ok){const messages:Record<string,string>={AUTH_REQUIRED:"برای سفارش وارد حساب شوید.",EXPRESS_UNAVAILABLE:"ارسال اکسپرس فعلاً فعال نیست.",INVALID_SHIPPING_CITY:"برای شهر انتخاب‌شده تعرفه وجود ندارد.",INVALID_POSTAL_CODE:"کد پستی معتبر نیست.",INSUFFICIENT_STOCK:"موجودی کالا کافی نیست.",PRODUCT_UNAVAILABLE:"یک محصول دیگر موجود نیست."};throw Error(messages[data.error]||"ثبت سفارش ناموفق بود.");}
      setReceipt(data.orderId);
      for(const [slug,qty] of Object.entries(cart))changeQuantity(slug,-qty);
      void fetch("/api/cart-snapshot",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:{}})}).catch(()=>{});
    }catch(e){setError(e instanceof Error?e.message:"خطا در اتصال به سرور");}finally{lock.current=false;setBusy(false);}
  }
  async function previewOrder(){
    const problem=validate();if(problem){setError(problem);return;}
    setBusy(true);setError("");setDemoResult("");
    try{const response=await fetch("/api/orders/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recipientName:recipient.name,recipientPhone:recipient.phone,shippingAddress:method==="pickup"?"":shippingAddressText,shippingProvince:method==="pickup"?"تهران":recipient.province,building:method==="pickup"?"":recipient.building,postalCode:method==="pickup"?"":postalCode,latitude:coords?.lat??null,longitude:coords?.lng??null,shippingCity:selectedCity,shippingMethod:method,items:lines.map(l=>({slug:l.product.slug,quantity:l.quantity}))})});const result=await response.json();if(!response.ok)throw Error(result.error??"امکان تست این سفارش نیست");setDemoResult(`تست موفق: مجموع ${Number(result.total).toLocaleString("fa-IR")} تومان. هیچ سفارشی ثبت نشد، پولی دریافت نشد و موجودی تغییر نکرد.`)}catch(e){setError(e instanceof Error?e.message:"تست ناموفق بود")}finally{setBusy(false)}
  }
  if(receipt)return <main className="mx-auto w-full max-w-2xl space-y-4 p-6"><PurchaseSteps current={3}/><div className={panel}><PackageCheck size={38} className="text-[#ecc87d]"/><h1 className="mt-3 text-2xl font-black text-[#f0d08d]">سفارش ثبت شد</h1><p className="mt-3 break-all">شناسه سفارش: <bdi>{receipt}</bdi></p><p className="mt-3 text-sm text-[#cdbb96]">پرداخت آنلاین فعال نیست؛ ثبت سفارش رسید پرداخت محسوب نمی‌شود.</p><Link className="mt-4 inline-block text-[#e8c477]" href="/orders">پیگیری سفارش</Link></div></main>;
  return <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 text-[#f5ead4]"><PurchaseSteps current={review?2:1}/><h1 className="text-2xl font-black">{review?"مرور نهایی سفارش":"مشخصات گیرنده و روش تحویل"}</h1>
    {catalogStatus !== "ready"?<div className={panel}>در حال بارگذاری اطلاعات کالا یا خطا در اتصال به کاتالوگ…</div>:
    !count||stockIssue||total===null?<div className={panel}>سبد خرید را بررسی کنید. <Link href="/cart" className="text-[#e7c47c]">بازگشت</Link></div>:
    review?<section className={`${panel} space-y-4`}><h2 className="text-xl font-bold">خلاصه سفارش</h2><p>{recipient.name} — <bdi dir="ltr">{recipient.phone}</bdi></p><p>{recipient.province||"تهران"}، {selectedCity}، {method==="pickup"?pickupAddress:shippingAddressText} {recipient.building&&`، پلاک ${recipient.building}`} {recipient.unit&&`، واحد ${recipient.unit}`}</p>{method!=="pickup"&&<p>کد پستی: {postalCode}</p>}
      <p className="text-[#e8c477]">روش تحویل: {methodItems.find(m=>m.id===method)?.label}</p>
      {lines.map(l=><div key={l.product.slug} className="flex justify-between gap-4 border-b border-[#56462d] pb-2 text-sm"><span>{l.product.name} × {l.quantity}</span><span>{productPrice(l.amount)}</span></div>)}
      <p>جمع کالاها: {productPrice(total)}</p><p>هزینه ارسال: {productPrice(shippingFee??0)}</p><p className="text-lg font-bold text-[#e8c477]">مبلغ کل: {productPrice(total+(shippingFee??0))}</p>
      {error&&<p role="alert" className="text-red-300">{error}</p>}
      <button type="button" onClick={()=>void previewOrder()} disabled={busy} className="min-h-12 w-full rounded-xl border border-[#e8ce8d] p-3 text-[#e8ce8d]">آزمایش سفارش بدون پرداخت و بدون ثبت واقعی</button><p role="status" className="text-sm text-[#e8ce8d]">{demoResult}</p><button type="button" onClick={submit} disabled={busy} className={`${gold} w-full`}>{busy?"در حال ثبت":"ثبت واقعی سفارش (بدون پرداخت آنلاین)"}</button>
      <button type="button" onClick={()=>setReview(false)} className="w-full rounded-xl border border-[#795f36] p-3 text-[#e7c47c]">بازگشت و ویرایش</button>
    </section>:
    <form className={`${panel} space-y-5`} onSubmit={proceed}>
      <section className="space-y-3"><h2 className="text-lg font-bold text-[#e8c477]">۱. روش تحویل</h2>
        <p className="text-xs text-[#cfb58a]">{loadingRates?"در حال دریافت تعرفه‌های شهر...":ratesAvailable?"روش‌های فعال ویژه شهر انتخاب‌شده":"روش‌های پیش‌فرض؛ پس از انتخاب شهر، تعرفه معتبر را بررسی کنید."}</p><div className="grid gap-3 sm:grid-cols-3">{methodItems.map(({id,label,caption,icon:Icon})=>{
          const disabled=!ratesAvailable && id==="express" && !settings?.express.active;
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
        {method!=="pickup" && <><IranCitySelect province={recipient.province} city={city} className={input} onChange={(province,nextCity)=>{setRecipient(old=>({...old,province}));updateStore(old=>({...old,city:nextCity}));setMethod("post");setCoords(null);}}/>
          <label>کد پستی ۱۰ رقمی<input required dir="ltr" inputMode="numeric" maxLength={10} className={input} value={recipient.postalCode} onChange={e=>setRecipient(old=>({...old,postalCode:postalDigits(e.target.value)}))} pattern="[0-9]{10}"/></label>
          <label>پلاک / ساختمان<input required maxLength={40} className={input} value={recipient.building} onChange={e=>setRecipient(old=>({...old,building:e.target.value}))}/></label>
          <label>واحد<input maxLength={40} className={input} value={recipient.unit} onChange={e=>setRecipient(old=>({...old,unit:e.target.value}))}/></label>
          <label className="sm:col-span-2">نام خیابان / کوچه<input required maxLength={160} className={input} value={recipient.street} onChange={e=>{setRecipient(old=>({...old,street:e.target.value}));setCoords(null)}}/></label>
          <label className="sm:col-span-2">ادامه نشانی کامل<textarea required rows={3} minLength={6} maxLength={1000} autoComplete="street-address" className={input} value={recipient.address} onChange={e=>setRecipient(old=>({...old,address:e.target.value}))}/></label>
          <div className="sm:col-span-2"><LocationPicker city={selectedCity} province={recipient.province} street={recipient.street} address={recipient.address} value={coords} onChange={setCoords} label="نقشه اختیاری (برای دقیق‌تر شدن نشانی)"/></div>
        </>}
        {method==="pickup" && <div className="sm:col-span-2 rounded-xl border border-[#7e663b] bg-[#0b0907] p-4 text-sm leading-7"><MapPin className="inline text-[#e8c477]" size={18}/> دریافت حضوری از: {pickupAddress}</div>}
      </section>
      <section className="space-y-2 border-t border-[#604b2b] pt-4"><h2 className="text-lg font-bold text-[#e8c477]">۳. هزینه سفارش</h2><p>جمع کالاها: {productPrice(total)}</p><p>هزینه تحویل: {shippingFee==null?"هنوز قابل محاسبه نیست":productPrice(shippingFee)}</p>{shippingFee!=null&&<strong className="block text-lg text-[#eac781]">مجموع: {productPrice(total+shippingFee)}</strong>}</section>
      {error&&<p role="alert" className="rounded-xl border border-[#9f373c] bg-[#451d23] p-3 text-sm text-red-200">{error}</p>}
      <button className={`${gold} w-full`} disabled={!canCheckout}>مرور و ثبت سفارش</button>
    </form>}
  </main>;
}
