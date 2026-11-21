"use client";
import {useEffect,useState} from "react";
import {ProductImageZoom} from "@/components/core/product-image-zoom";
import {ChevronLeft,ChevronRight,Images} from "lucide-react";
export default function ProductGallery({images,alt}:{images:string[];alt:string}){
 const usable=[...new Set(images.filter(x=>typeof x==="string"&&x.length>0))];
 const [index,setIndex]=useState(0);
 const current=usable[index]??usable[0]??"/images/categories/lighters.webp";
 useEffect(()=>{setIndex(0)},[images.join("|")]);
 return <section aria-label={`گالری ${alt}`} className="min-w-0"><div className="relative isolate aspect-square min-h-[280px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(155,103,53,.2),transparent_62%),linear-gradient(145deg,#231514,#0d0b09)] sm:min-h-[380px]">
 <ProductImageZoom key={current} src={current} alt={`${alt}؛ تصویر ${index+1}`} sizes="(min-width:1280px) 600px,(min-width:768px) 50vw,95vw" className="p-6 sm:p-12" priority={index===0}/>
 {usable.length>1&&<div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between"><button type="button" className="pointer-events-auto grid size-11 place-items-center rounded-full border border-[#c59a60] bg-[#1b1111]/90 text-[#f3d49f]" aria-label="تصویر قبلی" onClick={()=>setIndex(n=>(n+usable.length-1)%usable.length)}><ChevronRight/></button><button type="button" className="pointer-events-auto grid size-11 place-items-center rounded-full border border-[#c59a60] bg-[#1b1111]/90 text-[#f3d49f]" aria-label="تصویر بعدی" onClick={()=>setIndex(n=>(n+1)%usable.length)}><ChevronLeft/></button></div>}
 </div><div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-2" role="group" aria-label="انتخاب تصویر">{usable.map((src,i)=><button key={src} type="button" onClick={()=>setIndex(i)} aria-label={`نمایش تصویر ${i+1}`} aria-pressed={index===i} className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#211817] ${index===i?"border-[#f0cd83]":"border-[#624932]"}`}><img src={src} alt="" loading="lazy" className="h-full w-full object-contain"/></button>)}</div>{usable.length>1&&<p className="flex items-center gap-2 px-2 text-xs text-[#bfab8b]"><Images size={14}/>{(index+1).toLocaleString("fa-IR")} از {usable.length.toLocaleString("fa-IR")}</p>}</section>
}
