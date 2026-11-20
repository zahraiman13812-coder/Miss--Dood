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
 return <main className="mx-auto max-w-6xl space-y-6 min-w-0 px-3 py-5 text-[#f4dfbd] sm:px-6 sm:py-8 xl:px-8" dir="rtl">
 <Link href="/admin" className="inline-flex items-center gap-2 text-[#e8c17b]"><ArrowRight size={17}/> داشبورد مدیریت</Link><header><h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl"><ShieldCheck/> مدیران و دسترسی‌ها</h1><p className="mt-2 text-sm text-[#bba68c]">افزودن مدیر از میان کاربران ثبت‌نام‌شده؛ امکان ایجاد حساب بدون تأیید ایمیل وجود ندارد.</p></header>
 <input value={filter} onChange={e=>setFilter(e.target.value)} className={`${control} w-full`} placeholder="جست‌وجو با نام یا ایمیل" aria-label="جست‌وجوی کاربر"/>
 <p role="status" className="text-[#ebc188]">{message}</p><div className="hidden overflow-x-auto rounded-2xl border border-[#60452c] md:block"><table className="min-w-[680px] w-full text-right text-sm"><thead className="bg-[#311d1d] text-[#f3d7a2]"><tr><th className="p-4">نام</th><th>ایمیل</th><th>نقش</th><th>عملیات</th></tr></thead><tbody>{users.filter(u=>`${u.email} ${u.full_name}`.toLowerCase().includes(filter.toLowerCase())).map(u=><tr key={u.id} className="border-t border-[#60452c]"><td className="p-4">{u.full_name}</td><td dir="ltr" className="text-right">{u.email}</td><td>{u.role==="admin"?"مدیر":"مشتری"}</td><td><button disabled={busy} className="rounded-lg border border-[#a47d49] px-3 py-2 text-[#f0c987] disabled:opacity-50" onClick={()=>change(u.email,u.role==="admin"?"customer":"admin")}>{u.role==="admin"?"لغو نقش مدیر":"افزودن به مدیران"}</button></td></tr>)}</tbody></table></div>
 <div className="grid gap-3 md:hidden" aria-label="فهرست کاربران">{users.filter(u=>`${u.email} ${u.full_name}`.toLowerCase().includes(filter.toLowerCase())).map(u=><article key={u.id} className="min-w-0 space-y-3 rounded-2xl border border-[#60452c] bg-[#18110e] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><strong className="break-words">{u.full_name||"بدون نام"}</strong><span className="rounded-full border border-[#7f5e3b] px-2 py-1 text-xs">{u.role==="admin"?"مدیر":"مشتری"}</span></div><p dir="ltr" className="break-all text-left text-sm text-[#d5bd99]">{u.email}</p><button disabled={busy} className="min-h-11 w-full rounded-xl border border-[#a47d49] px-3 py-2 text-[#f0c987] disabled:opacity-50" onClick={()=>change(u.email,u.role==="admin"?"customer":"admin")}>{u.role==="admin"?"لغو نقش مدیر":"افزودن به مدیران"}</button></article>)}</div>
 <section className="min-w-0 rounded-2xl border border-[#60452c] p-3 sm:p-5"><h2 className="mb-4 text-xl font-extrabold">تاریخچه تغییرات</h2><div className="space-y-3">{events.map((e,i)=><div key={i} className="flex min-w-0 flex-wrap justify-between gap-2 break-all border-b border-[#503b2a] pb-3 text-xs"><span>{e.action} · {e.target}</span><span>{e.actor??"حساب حذف‌شده"} · {new Date(e.created_at).toLocaleString("fa-IR")}</span></div>)}</div></section>
 </main>
}
