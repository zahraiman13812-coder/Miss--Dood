"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowRight,ShieldCheck} from "lucide-react";
type User={id:string;email:string;full_name:string;role:string;created_at:string};
type Event={created_at:string;action:string;target:string;actor:string|null};
const control="min-h-11 rounded-xl border border-[#86653d] bg-[#18110e] px-4 text-[#f0d8a3]";
export default function TeamPage(){
 const [users,setUsers]=useState<User[]>([]);const [events,setEvents]=useState<Event[]>([]);
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const [filter,setFilter]=useState("");
 async function load(){const r=await fetch("/api/admin/team",{cache:"no-store"});if(!r.ok)throw Error("دسترسی به کاربران مجاز نیست");const d=await r.json();setUsers(d.users);setEvents(d.events)}
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function change(email:string,role:"admin"|"customer"){
  if(!window.confirm(`آیا نقش ${email} به ${role==="admin"?"مدیر":"مشتری"} تغییر کند؟`))return;
  setBusy(true);setMessage("");try{const r=await fetch("/api/admin/team",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,role})});const d=await r.json();if(!r.ok)throw Error(d.error||"خطای تغییر نقش");await load();setMessage("نقش کاربر ذخیره شد.")}catch(e){setMessage(e instanceof Error?e.message:"خطا")}finally{setBusy(false)}
 }
 return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-[#f4dfbd] sm:px-8" dir="rtl">
 <Link href="/admin" className="inline-flex items-center gap-2 text-[#e8c17b]"><ArrowRight size={17}/> داشبورد مدیریت</Link><header><h1 className="flex items-center gap-2 text-3xl font-black"><ShieldCheck/> مدیران و دسترسی‌ها</h1><p className="mt-2 text-sm text-[#bba68c]">افزودن مدیر از میان کاربران ثبت‌نام‌شده؛ امکان ایجاد حساب بدون تأیید ایمیل وجود ندارد.</p></header>
 <input value={filter} onChange={e=>setFilter(e.target.value)} className={`${control} w-full`} placeholder="جست‌وجو با نام یا ایمیل" aria-label="جست‌وجوی کاربر"/>
 <p role="status" className="text-[#ebc188]">{message}</p><div className="overflow-x-auto rounded-2xl border border-[#60452c]"><table className="min-w-[680px] w-full text-right text-sm"><thead className="bg-[#311d1d] text-[#f3d7a2]"><tr><th className="p-4">نام</th><th>ایمیل</th><th>نقش</th><th>عملیات</th></tr></thead><tbody>{users.filter(u=>`${u.email} ${u.full_name}`.toLowerCase().includes(filter.toLowerCase())).map(u=><tr key={u.id} className="border-t border-[#60452c]"><td className="p-4">{u.full_name}</td><td dir="ltr" className="text-right">{u.email}</td><td>{u.role==="admin"?"مدیر":"مشتری"}</td><td><button disabled={busy} className="rounded-lg border border-[#a47d49] px-3 py-2 text-[#f0c987] disabled:opacity-50" onClick={()=>change(u.email,u.role==="admin"?"customer":"admin")}>{u.role==="admin"?"لغو نقش مدیر":"افزودن به مدیران"}</button></td></tr>)}</tbody></table></div>
 <section className="rounded-2xl border border-[#60452c] p-5"><h2 className="mb-4 text-xl font-extrabold">تاریخچه تغییرات</h2><div className="space-y-3">{events.map((e,i)=><div key={i} className="flex flex-wrap justify-between gap-2 border-b border-[#503b2a] pb-3 text-xs"><span>{e.action} · {e.target}</span><span>{e.actor??"حساب حذف‌شده"} · {new Date(e.created_at).toLocaleString("fa-IR")}</span></div>)}</div></section>
 </main>
}
