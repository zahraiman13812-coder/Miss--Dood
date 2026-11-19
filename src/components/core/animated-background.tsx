"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Transition = { type?: "spring" | "tween"; bounce?: number; duration?: number };
type Props = {
  children: ReactNode;
  className?: string;
  defaultValue?: string;
  enableHover?: boolean;
  transition?: Transition;
};
type Line = { x: number; width: number; visible: boolean };

/** AnimatedBackground-compatible hover indicator: a gold underline, not a filled background. */
export function AnimatedBackground({
  children, className = "", defaultValue, enableHover = false, transition,
}: Props) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<Line>({ x: 0, width: 0, visible: false });

  const activeLink = useCallback(() => {
    const links = root.current?.querySelectorAll<HTMLElement>("[data-id]");
    if (!links) return null;
    const items = Array.from(links);
    // Prefer the longest matching URL so nested routes highlight their parent correctly.
    const matches = items.filter(link => {
      const href = link.getAttribute("href");
      return !!href && (pathname === href || (href !== "/" && pathname.startsWith(href + "/")));
    });
    return matches.sort((a, b) => (b.getAttribute("href")?.length ?? 0) - (a.getAttribute("href")?.length ?? 0))[0]
      ?? items.find(link => link.dataset.id === defaultValue)
      ?? null;
  }, [pathname, defaultValue]);

  const positionUnder = useCallback((link: HTMLElement | null) => {
    const host = root.current;
    if (!host || !link) {
      setLine(prev => prev.visible ? { ...prev, visible: false } : prev);
      return;
    }
    const hostRect = host.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    // left relative to host works with both RTL and LTR flex directions.
    const next = { x: linkRect.left - hostRect.left, width: linkRect.width, visible: true };
    setLine(prev => prev.x === next.x && prev.width === next.width && prev.visible ? prev : next);
  }, []);

  const restore = useCallback(() => positionUnder(activeLink()), [activeLink, positionUnder]);

  useEffect(() => {
    const frame = requestAnimationFrame(restore);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(restore);
    if (root.current) {
      observer?.observe(root.current);
      root.current.querySelectorAll<HTMLElement>("[data-id]").forEach(el => observer?.observe(el));
    }
    window.addEventListener("resize", restore);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", restore);
    };
  }, [restore]);

  const duration = Math.min(0.8, Math.max(0.1, transition?.duration ?? 0.3));
  const findLink = (target: EventTarget | null) => {
    const element = target instanceof Element ? target.closest<HTMLElement>("[data-id]") : null;
    return element && root.current?.contains(element) ? element : null;
  };

  return (
    <div
      ref={root}
      className={`relative flex items-center ${className}`}
      onPointerOver={event => {
        if (enableHover && event.pointerType !== "touch") {
          const link = findLink(event.target);
          if (link) positionUnder(link);
        }
      }}
      onPointerLeave={restore}
      onFocusCapture={event => {
        const link = findLink(event.target);
        if (link) positionUnder(link);
      }}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) restore();
      }}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 h-[2px] rounded-full bg-[#e4bf76] shadow-[0_0_10px_rgba(228,191,118,.55)] motion-reduce:transition-none"
        style={{
          left: line.x,
          width: line.width,
          opacity: line.visible ? 1 : 0,
          transition: `left ${duration}s cubic-bezier(.22,1,.36,1), width ${duration}s cubic-bezier(.22,1,.36,1), opacity .15s ease`,
        }}
      />
    </div>
  );
}
