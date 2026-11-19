"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// The original images are 1672×941; preserve the ratio so nothing gets cropped.
const slides = [
  { file: "miss-dood-1", alt: "بنر اول میس دود" },
  { file: "miss-dood-2", alt: "بنر دوم میس دود" },
  { file: "miss-dood-3", alt: "بنر سوم میس دود" },
];
const control = "grid size-10 shrink-0 place-items-center rounded-full border border-[#b68b4c]/50 bg-[#110c0a]/85 text-[#f5d18d] backdrop-blur transition hover:border-[#f2d193] hover:bg-[#3d211f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d18d] sm:size-11";

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const start = useRef<{x:number;y:number} | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex(i => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [playing]);
  function move(step:number) { setIndex(i => (i + step + slides.length) % slides.length); setPlaying(false); }
  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!start.current) return;
    const deltaX = event.clientX - start.current.x;
    const deltaY = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) move(deltaX > 0 ? 1 : -1);
  }
  return (
    <section aria-label="گالری بنرهای میس دود" className="mx-auto w-full max-w-[1440px] min-w-0 px-3 pt-4 pb-5 sm:px-6 sm:pt-6 sm:pb-8 xl:px-8">
      <div className="relative isolate w-full touch-pan-y overflow-hidden rounded-[20px] border border-[#6e552c] bg-[#0b0907] shadow-[0_20px_58px_rgba(0,0,0,.35)] sm:rounded-[28px]" onPointerDown={e => { if(e.isPrimary && e.pointerType === "touch") start.current={x:e.clientX,y:e.clientY}; }} onPointerUp={onPointerUp} onPointerCancel={() => { start.current=null; }}>
        <div className="relative w-full aspect-[1672/941]">
          {slides.map((slide, i) => (
            <Image key={slide.file} src={`/images/hero/${slide.file}.webp`} alt={slide.alt} fill priority={i===0}
              sizes="(min-width: 1440px) 1376px, (min-width: 768px) 95vw, 100vw"
              aria-hidden={i!==index}
              className={`object-contain object-center motion-safe:transition-opacity motion-safe:duration-700 ${index===i ? "opacity-100" : "pointer-events-none opacity-0"}`} />
          ))}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-[#050403]/80 to-transparent"/>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 sm:inset-x-5 sm:bottom-5">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#b68b4c]/50 bg-[#090806]/80 p-1 backdrop-blur-lg">
              <button type="button" className={control} aria-label="بنر قبلی" onClick={()=>move(-1)}><ChevronRight size={19}/></button>
              <span className="min-w-12 text-center text-xs font-bold text-[#e4c078]" dir="ltr" aria-live={playing ? "off" : "polite"}>{(index+1).toLocaleString("fa-IR")} / {slides.length.toLocaleString("fa-IR")}</span>
              <button type="button" className={control} aria-label="بنر بعدی" onClick={()=>move(1)}><ChevronLeft size={19}/></button>
              <button type="button" className={control} aria-label={playing ? "توقف پخش خودکار" : "شروع پخش خودکار"} onClick={()=>setPlaying(p=>!p)}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button>
            </div>
            <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-[#806638] bg-[#100c09]/75 px-4 py-2 text-xs font-semibold text-[#e8d09d] backdrop-blur md:flex"><span aria-hidden="true" className="size-1.5 rounded-full bg-[#9d3034]"/> MISS DOOD</div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2" role="group" aria-label="انتخاب بنر">
        {slides.map((slide,i)=><button key={slide.file} type="button" aria-label={`نمایش بنر ${i+1}`} aria-current={index===i?"true":undefined} onClick={()=>{setIndex(i);setPlaying(false);}} className={`h-1.5 rounded-full transition-all ${index===i ? "w-8 bg-[#e4bf76]" : "w-4 bg-[#685432] hover:bg-[#a98a50]"}`}/>)}
      </div>
    </section>
  );
}
