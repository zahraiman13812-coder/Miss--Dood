"use client";
import Image from "next/image";
import {useEffect,useState} from "react";
import type {Banner} from "@/lib/cms-types";
export default function HeroSlider({banners}:{banners:Banner[]}){
 const slides=banners.filter(b=>b.active);const[index,setIndex]=useState(0);const[animate,setAnimate]=useState(false);
 useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setAnimate(!media.matches);sync();media.addEventListener("change",sync);return ()=>media.removeEventListener("change",sync)},[]);
 useEffect(()=>{if(!animate||slides.length<2)return;const id=setInterval(()=>{if(!document.hidden)setIndex(v=>(v+1)%slides.length)},5000);return ()=>clearInterval(id)},[animate,slides.length]);
 if(!slides.length)return null;
 return <section aria-label="بنرهای فروشگاه" className="mx-auto w-full max-w-[1440px] px-3 pb-6 pt-4 sm:px-6 sm:pt-6 xl:px-8"><div className="relative isolate aspect-[1672/941] w-full overflow-hidden rounded-[20px] border border-[#8e6938]/75 bg-[#0d0a08] shadow-[0_20px_58px_rgba(0,0,0,.35)] sm:rounded-[28px]">
 {slides.map((slide,i)=><div key={i} aria-hidden={i!==index} className={`absolute inset-0 transition-opacity duration-700 ${i===index?"opacity-100":"pointer-events-none opacity-0"}`}>
 {slide.src.startsWith("https://")?<img src={slide.src} alt={slide.alt} className="size-full object-contain" loading={i===0?"eager":"lazy"}/>:<Image src={slide.src} alt={slide.alt} fill priority={i===0} sizes="(min-width: 1440px) 1376px, (min-width: 768px) 95vw, 100vw" className="object-contain"/>}
 </div>)}</div></section>;
}
