"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type RefObject } from "react";
import styles from "./animated-group.module.css";

type Props = {children: ReactNode; className?: string; preset?: "scale" | "fade"; as?: ElementType; elementRef?: RefObject<HTMLUListElement | null>};
/** Reveal each direct child once upon entering the viewport. */
export function AnimatedGroup({children, className = "", preset = "scale", as: Tag = "div", elementRef}: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const parent = ref.current;
    if (!parent) return;
    const items = Array.from(parent.children) as HTMLElement[];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      items.forEach(item => item.dataset.revealed = "true");
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.revealed = "true";
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.06, rootMargin: "0px 0px 50px 0px"});
    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index % 12, 7) * 55}ms`);
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, [children]);
  return <Tag ref={(node: HTMLElement | null) => { ref.current = node; if (elementRef) (elementRef as {current: HTMLUListElement | null}).current = node as HTMLUListElement | null; }} className={`${styles.group} ${preset === "fade" ? styles.fade : styles.scale} ${className}`}>{children}</Tag>;
}
