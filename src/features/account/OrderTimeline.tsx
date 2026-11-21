"use client";
import {useEffect,useState} from "react";
const labels:Record<string,string>={received:"ثبت سفارش",processing:"در حال آماده‌سازی",shipped:"ارسال شده",delivered:"تحویل شده",cancelled:"لغو شده"};
export default function OrderTimeline({orderId}:{orderId:string}){
 const [events,setEvents]=useState<{to_status:string;created_at:string}[]>([]);
 useEffect(()=>{fetch(`/api/orders/${orderId}/timeline`,{cache:"no-store"}).then(r=>r.json()).then(d=>setEvents(d.events??[])).catch(()=>{})},[orderId]);
 return <section className="mt-5 rounded-xl border border-[#795b38] p-4"><h2 className="mb-4 font-bold">روند سفارش</h2><ol className="space-y-4 border-r border-[#9c7645] pr-4">{events.map((e,i)=><li key={i} className="relative text-sm before:absolute before:-right-[21px] before:top-1 before:size-2 before:rounded-full before:bg-[#dfbd7e]"><strong>{labels[e.to_status]??e.to_status}</strong><time className="mt-1 block text-xs text-[#bba58b]">{new Date(e.created_at).toLocaleString("fa-IR")}</time></li>)}</ol></section>;
}
