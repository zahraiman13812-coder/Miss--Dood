"use client";

import { Children, type CSSProperties, type ReactNode } from "react";
import styles from "./infinite-slider.module.css";

type InfiniteSliderProps = {
  children: ReactNode;
  className?: string;
  gap?: number;
  speedOnHover?: number;
  speed?: number;
};

/** Continuously loops one accessible set of links with a decorative, non-focusable duplicate. */
export function InfiniteSlider({ children, className = "", gap = 24, speed = 42, speedOnHover = 90 }: InfiniteSliderProps) {
  const entries = Children.toArray(children);
  if (!entries.length) return null;
  return (
    <div className={`${styles.viewport} ${className}`} style={{ "--md-gap": `${gap}px`, "--md-speed": `${speed}s`, "--md-hover-speed": `${speedOnHover}s` } as CSSProperties}>
      <div className={styles.track} dir="ltr">
        <div className={styles.group} dir="rtl">{entries}</div>
        <div className={styles.group} dir="rtl" aria-hidden="true" inert>{entries}</div>
      </div>
    </div>
  );
}
