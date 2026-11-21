"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
export default function VitalsClient(){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname.startsWith("/admin"))return;
  const observers:PerformanceObserver[]=[];
  const mobile=window.matchMedia("(max-width: 767px)").matches;
  const send=(metric:string,value:number)=>{if(Math.random()>0.15)return;
   const path=pathname.replace(/[^a-z0-9/_-]/gi,"").slice(0,180)||"/";
   fetch("/api/vitals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metric,value,path,device:mobile?"mobile":"desktop"}),keepalive:true}).catch(()=>{});
  };
  if(typeof PerformanceObserver==="undefined")return;
  try{const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.entryType==="largest-contentful-paint")send("LCP",entry.startTime)}});observer.observe({type:"largest-contentful-paint",buffered:true});observers.push(observer)}catch{}
  try{let cls=0;const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries()){const e=entry as PerformanceEntry & {value?:number;hadRecentInput?:boolean};if(!e.hadRecentInput)cls+=e.value??0}});observer.observe({type:"layout-shift",buffered:true});observers.push(observer);const onHide=()=>{if(document.visibilityState==="hidden")send("CLS",cls)};document.addEventListener("visibilitychange",onHide);return ()=>{document.removeEventListener("visibilitychange",onHide);observers.forEach(o=>o.disconnect())}}catch{}
  return ()=>observers.forEach(o=>o.disconnect());
 },[pathname]);
 return null;
}
