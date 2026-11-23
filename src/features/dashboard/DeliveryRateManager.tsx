"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {IranCitySelect} from "@/features/store/IranCitySelect";
type Method="post"|"express"|"pickup";
type Rate={id:string;province:string;city:string;key:Method;label:string;fee:number;days:string;active:boolean};
const field="mt-2 w-full min-h-11 rounded-xl border border-[#765b38] bg-[#120e0d] p-3 text-[#f7e4c7]";
const names:Record<Method,string>={post:"پست",express:"اکسپرس",pickup:"حضوری"};
const empty={province:"",city:"",key:"post" as Method,label:"پست",fee:0,days:"۳ تا ۷ روز کاری",active:true};
export default function DeliveryRateManager(){
 const [rates,setRates]=useState<Rate[]>([]);
 const [form,setForm]=useState(empty);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{const r=await fetch("/api/admin/delivery-rates",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error??"دریافت تعرفه‌ها ناموفق بود");setRates(d.rates??[])},[]);
 useEffect(()=>{void load().catch(e=>setMessage(e.message))},[load]);
 function reset(){setEditingId(null);setForm(empty)}
 function startEdit(rate:Rate){setEditingId(rate.id);setForm({province:rate.province,city:rate.city,key:rate.key,label:rate.label,fee:rate.fee,days:rate.days,active:rate.active});document.getElementById("rate-editor")?.scrollIntoView({behavior:"smooth",block:"start"})}
 async function request(method:"POST"|"PATCH"|"DELETE",body:unknown){const r=await fetch("/api/admin/delivery-rates",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error==="DUPLICATE_RATE"?"برای این شهر و روش ارسال، تعرفه دیگری وجود دارد.":d.error??"عملیات ناموفق بود")}
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{await request(editingId?"PATCH":"POST",editingId?{...form,id:editingId}:form);await load();reset();setMessage("تعرفه با موفقیت ذخیره شد.")}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}}
 async function toggle(rate:Rate){setBusy(true);setMessage("");try{await request("PATCH",{id:rate.id,active:!rate.active});await load()}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}}
 async function remove(rate:Rate){if(!window.confirm(`تعرفه ${rate.label} برای ${rate.city} حذف شود؟`))return;setBusy(true);setMessage("");try{await request("DELETE",{id:rate.id});await load();if(editingId===rate.id)reset();setMessage("تعرفه حذف شد.")}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}}
 return <section className="space-y-5 rounded-2xl border border-[#715334] bg-[#1a1211] p-5">
  <div><h2 className="text-xl font-black text-[#eac78d]">تعرفه‌های ارسال هر شهر</h2><p className="mt-2 text-sm leading-7 text-[#c6ad8e]">فقط سه روش پست، اکسپرس و تحویل حضوری قابل انتخاب هستند. تعرفه‌های ثبت‌شده را می‌توان ویرایش، غیرفعال یا حذف کرد. حذف تعرفه، سابقه سفارش‌های قبلی را حذف نمی‌کند.</p></div>
  <form id="rate-editor" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" onSubmit={e=>void save(e)}>
   {editingId&&<p className="sm:col-span-2 xl:col-span-3 text-[#eac78d]">در حال ویرایش تعرفه <b>{editingId}</b></p>}
   <IranCitySelect province={form.province} city={form.city} className={field} onChange={(province,city)=>setForm(v=>({...v,province,city}))}/>
   <label>نوع ارسال<select className={field} value={form.key} onChange={e=>{const key=e.target.value as Method;setForm(v=>({...v,key,label:names[key]}))}}><option value="post">پست</option><option value="express">اکسپرس</option><option value="pickup">حضوری</option></select></label>
   <label>عنوان نمایشی<input className={field} required maxLength={100} value={form.label} onChange={e=>setForm(v=>({...v,label:e.target.value}))}/></label>
   <label>هزینه (تومان)<input className={field} type="number" min="0" max="100000000" step="1" required value={form.fee} onChange={e=>setForm(v=>({...v,fee:Number(e.target.value)}))}/></label>
   <label>زمان تحویل<input className={field} required maxLength={100} value={form.days} onChange={e=>setForm(v=>({...v,days:e.target.value}))}/></label>
   <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm(v=>({...v,active:e.target.checked}))}/> فعال باشد</label>
   <button type="submit" disabled={busy||!form.city} className="min-h-11 rounded-xl bg-[#d4aa6e] px-4 font-bold text-[#23120d] disabled:opacity-50">{editingId?"ذخیره ویرایش":"افزودن تعرفه"}</button>
   {editingId&&<button type="button" disabled={busy} onClick={reset} className="min-h-11 rounded-xl border border-[#96734c] px-4">انصراف از ویرایش</button>}
  </form><p role="status" className="text-sm text-[#e7bd80]">{message}</p>
  <div className="max-h-96 space-y-2 overflow-y-auto">{rates.map(rate=><div key={rate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#695038] p-3 text-sm"><div><b>{rate.province} / {rate.city} — {rate.label}</b><p className="text-xs text-[#b7a084]">{names[rate.key]} | {rate.fee.toLocaleString("fa-IR")} تومان | {rate.days} | {rate.active?"فعال":"غیرفعال"}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>startEdit(rate)} className="rounded-lg border border-[#96734c] px-3 py-2">ویرایش</button><button type="button" disabled={busy} onClick={()=>void toggle(rate)} className="rounded-lg border border-[#96734c] px-3 py-2">{rate.active?"غیرفعال کن":"فعال کن"}</button><button type="button" disabled={busy} onClick={()=>void remove(rate)} className="rounded-lg border border-red-500/60 px-3 py-2 text-red-200">حذف</button></div></div>)}{rates.length===0&&<p className="text-sm text-[#b7a084]">تعرفه‌ای ثبت نشده است.</p>}</div>
 </section>;
}
