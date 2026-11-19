"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./scroll-reveal.module.css";

/** Applies a single reveal to content sections site-wide, including sections rendered after data fetching. */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.getElementById("main-content");
    if (!root) return;

    const selector = "section:not([data-no-reveal]), main > article:not([data-no-reveal]), main > aside:not([data-no-reveal])";
    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(styles.revealed);
        entry.target.classList.remove(styles.pending);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.03, rootMargin: "0px 0px -6% 0px" });

    const scan = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach(el => {
        if (observed.has(el)) return;
        observed.add(el);
        // Prevent nested layout cards from fading twice. Existing animated-group owns product-card reveals.
        if (el.closest("[data-animated-group], [data-no-reveal]")) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) return;
        el.classList.add(styles.pending);
        observer.observe(el);
      });
    };
    scan();
    // Only watch inserted/removed nodes, not style/class changes made by this effect.
    const changes = new MutationObserver(scan);
    changes.observe(root, { childList: true, subtree: true });
    return () => {
      changes.disconnect();
      observer.disconnect();
      root.querySelectorAll<HTMLElement>(`.${styles.pending}`).forEach(el => el.classList.remove(styles.pending));
    };
  }, [pathname]);
  return null;
}
