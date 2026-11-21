"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {IranCitySelect} from "@/features/store/IranCitySelect";
type Rate={id:string;province:string;city:string;key:string;label:string;fee:number;days:string;active:boolean};
const field="mt-2 w-full min-h-11 rounded-xl border border-[#765b38] bg-[#120e0d] p-3 text-[#f7e4c7]";
const defaultForm={province:"",city:"",key:"post",label:"پست",fee:0,days:"۳ تا ۷ روز کاری",active:true};
export default function DeliveryRateManager(){
 const [rates,setRates]=useState<Rate[]>([]);const [form,setForm]=useState(defaultForm);const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await fetch("/api/admin/delivery-rates",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error??"دریافت تعرفه‌ها ناموفق بود");setRates(d.rates??[])},[]);
 useEffect(()=>{void load().catch(e=>setMessage(e.message))},[load]);
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const r=await fetch("/api/admin/delivery-rates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error??"ذخیره ناموفق بود");await load();setMessage("تعرفه ذخیره شد.")}catch(e){setMessage(e instanceof Error?e.message:"خطا") }finally{setBusy(false)}}
 async function toggle(rate:Rate){setBusy(true);try{const r=await fetch("/api/admin/delivery-rates",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:rate.id,active:!rate.active})});if(!r.ok)throw Error("تغییر وضعیت ناموفق بود");await load()}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}}
 return <section className="space-y-5 rounded-2xl border border-[#715334] bg-[#1a1211] p-5">
  <div><h2 className="text-xl font-black text-[#eac78d]">تعرفه‌های چندگانه هر شهر</h2><p className="mt-2 text-sm leading-7 text-[#c6ad8e]">برای هر استان و شهر می‌توان چند روش مستقل تعریف کرد؛ مثل پست، اکسپرس، تحویل حضوری یا روش دلخواه. شناسه انگلیسی روش باید برای هر شهر یکتا باشد. غیرفعال‌کردن روش، سفارش‌های قبلی را تغییر نمی‌دهد.</p></div>
  <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={e=>void save(e)}>
   <IranCitySelect province={form.province} city={form.city} className={field} onChange={(province,city)=>setForm(v=>({...v,province,city}))}/>
   <label>نوع ارسال<select className={field} value={["post","express","pickup"].includes(form.key)?form.key:"other"} onChange={e=>{const key=e.target.value;setForm(v=>({...v,key:key==="other"?"custom":key,label:key==="post"?"پست":key==="express"?"اکسپرس":key==="pickup"?"حضوری":"روش جدید"}))}}><option value="post">پست</option><option value="express">اکسپرس</option><option value="pickup">حضوری</option><option value="other">روش جدید</option></select></label>
   <label>شناسه انگلیسی روش<input className={field} pattern="[a-z][a-z0-9_]{1,31}" required value={form.key} onChange={e=>setForm(v=>({...v,key:e.target.value}))}/></label>
   <label>عنوان نمایشی<input className={field} required value={form.label} onChange={e=>setForm(v=>({...v,label:e.target.value}))}/></label>
   <label>هزینه (تومان)<input className={field} type="number" min="0" max="100000000" step="1" required value={form.fee} onChange={e=>setForm(v=>({...v,fee:Number(e.target.value)}))}/></label>
   <label>زمان تحویل<input className={field} required value={form.days} onChange={e=>setForm(v=>({...v,days:e.target.value}))}/></label>
   <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm(v=>({...v,active:e.target.checked}))}/> فعال باشد</label>
   <button type="submit" disabled={busy||!form.city} className="min-h-11 rounded-xl bg-[#d4aa6e] px-4 font-bold text-[#23120d] disabled:opacity-50">ثبت یا بروزرسانی تعرفه</button>
  </form><p role="status" className="text-sm text-[#e7bd80]">{message}</p>
  <div className="max-h-96 space-y-2 overflow-y-auto">{rates.map(rate=><div key={rate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#695038] p-3 text-sm"><div><b>{rate.province} / {rate.city} — {rate.label}</b><p className="text-xs text-[#b7a084]">{rate.key} | {rate.fee.toLocaleString("fa-IR")} تومان | {rate.days}</p></div><button disabled={busy} onClick={()=>void toggle(rate)} className="rounded-lg border border-[#96734c] px-3 py-2">{rate.active?"غیرفعال کن":"فعال کن"}</button></div>)}</div>
 </section>
}
