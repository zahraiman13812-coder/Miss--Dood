"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";

/** Enlarges an actual catalog image without navigating away from the product. */
export function ProductImageZoom({
  src, alt, sizes, priority = false, className = "", 
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      // Modal contains only one keyboard-focusable control (close).
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => closeButton.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
      opener.current?.focus();
    };
  }, [open]);

  return <>
    <button
      ref={opener}
      type="button"
      onClick={() => setOpen(true)}
      className="group/zoom absolute inset-0 block h-full w-full cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e4bf76]"
      aria-label={`بزرگ‌نمایی تصویر ${alt}`}
      aria-haspopup="dialog"
    >
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes}
        className={`object-contain transition-transform duration-500 ease-out group-hover/zoom:scale-[1.055] motion-reduce:transition-none ${className}`} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-[#ab814a]/70 bg-[#120d0b]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#e8c686] opacity-90 transition-opacity group-hover/zoom:opacity-100">
        <ZoomIn size={15}/> بزرگ‌نمایی
      </span>
    </button>
    {mounted && open && createPortal(
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#070505]/95 p-3 backdrop-blur-xl sm:p-8"
        role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <style>{`@keyframes md-zoom-in { from { opacity: 0; transform: translateY(24px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        <div role="dialog" aria-modal="true" aria-label={`نمایش بزرگ تصویر ${alt}`}
          className="relative flex h-full w-full max-w-[1400px] flex-col items-center justify-center rounded-2xl border border-[#a07b4a]/60 bg-[radial-gradient(circle_at_center,#2d1d1c_0%,#100c0b_68%)] shadow-[0_20px_100px_#0009] animate-[md-zoom-in_280ms_ease-out_both] motion-reduce:animate-none">
          <button ref={closeButton} type="button" onClick={() => setOpen(false)}
            className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#d5ad71]/70 bg-[#1d1010] text-[#f1d092] transition-colors hover:bg-[#633039] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e4bf76] sm:left-5 sm:top-5"
            aria-label="بستن تصویر"><X size={21}/></button>
          <div className="relative h-[min(80vh,900px)] w-full max-w-[1200px]">
            <Image src={src} alt={alt} fill sizes="(max-width:768px) 95vw, 90vw" className="object-contain p-5 sm:p-8" />
          </div>
          <p className="max-w-full px-5 pb-4 text-center text-sm font-semibold text-[#e9d5b4]">{alt}</p>
        </div>
      </div>, document.body
    )}
  </>;
}
