"use client";
import {useEffect,useState} from "react";
/** Optional local-only draft for low-risk text fields; never use for secrets or PII. */
export function DraftTextarea({draftKey,initial="",label}:{draftKey:string;initial?:string;label:string}){
 const [value,setValue]=useState(initial);const [ready,setReady]=useState(false);
 useEffect(()=>{try{setValue(sessionStorage.getItem(`md-draft:${draftKey}`)??initial)}catch{}setReady(true)},[draftKey,initial]);
 useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(`md-draft:${draftKey}`,value)}catch{}},[value,draftKey,ready]);
 return <div><label className="mb-2 block text-sm" htmlFor={`draft-${draftKey}`}>{label}</label><textarea id={`draft-${draftKey}`} value={value} onChange={e=>setValue(e.target.value)} className="min-h-28 w-full rounded-lg border border-[#795936] bg-[#110d0e] p-3 text-sm"/><p className="mt-2 text-xs text-[#b5a287]">پیش‌نویس فقط در همین تب مرورگر ذخیره می‌شود؛ برای انتشار، محتوای آن را به فرم اصلی منتقل کنید.</p><button className="mt-2 rounded-lg border border-[#84613b] px-3 py-2 text-xs" onClick={()=>{setValue("");try{sessionStorage.removeItem(`md-draft:${draftKey}`)}catch{}}}>پاک‌کردن پیش‌نویس</button></div>
}
