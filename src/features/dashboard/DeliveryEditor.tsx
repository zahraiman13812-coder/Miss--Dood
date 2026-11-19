"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Truck } from "lucide-react";

export default function DeliveryEditor() {
  const [fee,setFee] = useState("0");
  const [active,setActive] = useState(false);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  useEffect(()=> { fetch("/api/admin/delivery",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
    if(d?.express){setFee(String(d.express.fee));setActive(d.express.active);}
  }).catch(()=>{}); },[]);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setNotice("");
    try { const r=await fetch("/api/admin/delivery",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({fee:Number(fee),active})});
      if(!r.ok)throw Error("ذخیره تعرفه ناموفق بود.");setNotice("تنظیمات اکسپرس ذخیره شد.");
    } catch(e) {setNotice(e instanceof Error?e.message:"خطا در ذخیره");}finally{setBusy(false);}
  }
  return <section className="rounded-2xl border border-[#7e6234] bg-[#120e0b] p-5">
    <h2 className="flex items-center gap-2 text-xl font-black text-[#e9c783]"><Truck size={21}/> ارسال اکسپرس تهران</h2>
    <p className="mt-2 text-sm text-[#bbaa8b]">هزینه اکسپرس را مشخص کنید. تا زمانی که فعال نشده، مشتری امکان انتخاب آن را ندارد.</p>
    <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-end">
      <label className="text-sm text-[#f0dfbc]">هزینه اکسپرس (تومان)<input type="number" min="0" max="100000000" step="1" required value={fee} onChange={e=>setFee(e.target.value)} className="mt-2 w-full rounded-xl border border-[#7e6234] bg-[#0b0807] p-3 text-white"/></label>
      <label className="flex min-h-12 items-center gap-3 text-sm text-[#f0dfbc]"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> فعال برای مشتری</label>
      <button disabled={busy} className="min-h-12 rounded-xl bg-[#d1aa63] px-5 font-bold text-[#140e08] disabled:opacity-50">{busy?"در حال ذخیره":"ذخیره هزینه ارسال"}</button>
    </form>{notice&&<p role="status" className="mt-3 text-sm text-[#e7cc91]">{notice}</p>}
  </section>;
}
