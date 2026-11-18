"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const slides = [
  { file: "miss-dood-1", alt: "بنر اول مجموعه میس دود" },
  { file: "miss-dood-2", alt: "بنر دوم مجموعه میس دود" },
  { file: "miss-dood-3", alt: "بنر سوم مجموعه میس دود" },
];
const control = "grid size-10 place-items-center rounded-full border border-[#d7b56d]/35 bg-black/55 text-[#f1d69b] backdrop-blur transition hover:border-[#e7c783] hover:bg-[#3a2c16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e7c783]";

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPlaying(!motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [playing]);

  function move(step: number) {
    setPlaying(false);
    setIndex((i) => (i + step + slides.length) % slides.length);
  }

  return (
    <section aria-label="بنرهای میس دود" className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
      <div className="relative isolate aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#806638]/60 bg-[#100e0a] shadow-[0_18px_55px_rgba(0,0,0,.35)] min-[1020px]:aspect-[2.15/1] min-[1020px]:rounded-[28px] min-[1020px]:border-[#b08b4b]/55">
        {slides.map((slide, i) => (
          <Image
            key={slide.file}
            src={`/images/hero/${slide.file}.webp`}
            alt={slide.alt}
            fill
            priority={i === 0}
            aria-hidden={index !== i}
            sizes="(min-width: 1440px) 1376px, (min-width: 1020px) 96vw, 100vw"
            className={`object-contain min-[1020px]:object-contain transition-opacity duration-700 motion-reduce:transition-none ${index === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 pb-3 pt-12 sm:px-5 sm:pb-5">
          <div className="flex items-center gap-1.5 rounded-full border border-[#d7b56d]/35 bg-black/65 p-1 text-[#f4e6c4] shadow-lg backdrop-blur-md">
            <button type="button" className={control} aria-label="بنر قبلی" onClick={() => move(-1)}><ChevronRight size={18}/></button>
            <span className="min-w-12 text-center text-xs font-semibold tabular-nums" dir="ltr" aria-live={playing ? "off" : "polite"}>
              {(index + 1).toLocaleString("fa-IR")} / {slides.length.toLocaleString("fa-IR")}
            </span>
            <button type="button" className={control} aria-label="بنر بعدی" onClick={() => move(1)}><ChevronLeft size={18}/></button>
            <button type="button" className={control} aria-label={playing ? "توقف پخش" : "شروع پخش"} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={16}/> : <Play size={16}/>}
            </button>
          </div>
          <div className="hidden rounded-full border border-[#d7b56d]/30 bg-black/45 px-4 py-2 text-xs font-medium text-[#f1d69b] backdrop-blur sm:block">
            MISS DOOD <span className="mx-2 text-[#a8874d]">✦</span> انتخابی متفاوت
          </div>
        </div>
      </div>
    </section>
  );
}
