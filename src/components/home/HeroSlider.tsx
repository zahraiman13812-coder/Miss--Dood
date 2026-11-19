"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// The original banners are 1672 x 941; preserve their intrinsic ratio.
const slides = [
  {file:"miss-dood-1",alt:"بنر اول میس دود"},
  {file:"miss-dood-2",alt:"بنر دوم میس دود"},
  {file:"miss-dood-3",alt:"بنر سوم میس دود"},
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    // Five-second automatic rotation; pause while the page is hidden.
    if (!animate) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex(previous => (previous + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [animate]);
  return <section aria-label="بنرهای فروشگاه میس دود" className="mx-auto w-full max-w-[1440px] min-w-0 px-3 pb-6 pt-4 sm:px-6 sm:pt-6 xl:px-8">
    <div className="relative isolate aspect-[1672/941] w-full overflow-hidden rounded-[20px] border border-[#8e6938]/75 bg-[#0d0a08] shadow-[0_20px_58px_rgba(0,0,0,.35)] sm:rounded-[28px]">
      {slides.map((slide, i) => <Image key={slide.file} src={`/images/hero/${slide.file}.webp`} alt={slide.alt}
        fill priority={i===0} sizes="(min-width: 1440px) 1376px, (min-width: 768px) 95vw, 100vw"
        aria-hidden={i!==index} className={`object-contain object-center motion-safe:transition-opacity motion-safe:duration-700 ${i===index ? "opacity-100" : "pointer-events-none opacity-0"}`} />)}
    </div>
  </section>;
}
