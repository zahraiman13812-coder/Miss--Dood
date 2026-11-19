import type { CSSProperties, ReactNode } from "react";
import styles from "./glow-effect.module.css";

type GlowEffectProps = {
  children?: ReactNode;
  className?: string;
  colors?: string[];
  mode?: "colorShift";
  blur?: "soft" | "strong";
  duration?: number;
  scale?: number;
};
/** Decorative glow stays behind the actual interactive element. */
export function GlowEffect({ children, className = "", colors = ["#e4bf76", "#9e3438", "#c19b58"], duration = 4, scale = 0.95, blur = "soft" }: GlowEffectProps) {
  const palette = colors.length ? colors : ["#e4bf76"];
  const background = `conic-gradient(from 0deg, ${palette.join(", ")}, ${palette[0]})`;
  return (
    <span className={`${styles.wrap} ${className}`}>
      <span aria-hidden="true" className={`${styles.glow} ${blur === "strong" ? styles.strong : ""}`}
        style={{"--md-glow-background":background,"--md-glow-duration":`${Math.max(1,duration)}s`,"--md-glow-scale":scale} as CSSProperties}/>
      <span className={styles.content}>{children}</span>
    </span>
  );
}
