"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Page scroll progress, reading document scroll rather than an inner container. */
export function ScrollProgress({className = ""}: {className?: string}) {
  const indicator = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const root = document.documentElement;
      const max = Math.max(0,root.scrollHeight - window.innerHeight);
      const position = Math.max(0, Math.min(1, max > 0 ? window.scrollY/max : 0));
      if (indicator.current) indicator.current.style.transform = `scaleX(${position})`;
    };
    const schedule = () => {if (!raf) raf = window.requestAnimationFrame(update)};
    update();
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule);
    return () => {window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);window.cancelAnimationFrame(raf)};
  },[pathname]);
  return <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 top-0 z-[110] h-[3px] bg-[#221b16]/70 ${className}`}>
    <div ref={indicator} className="h-full w-full origin-right scale-x-0 bg-[linear-gradient(to_left,#e4bf76_10%,#9e3438_58%,#e4bf76_100%)] shadow-[0_0_9px_#e4bf76aa] motion-safe:transition-transform motion-safe:duration-75"/>
  </div>;
}
