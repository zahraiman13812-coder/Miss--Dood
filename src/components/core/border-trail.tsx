import type { CSSProperties } from "react";
import styles from "./border-trail.module.css";

type BorderTrailProps = { size?: number; className?: string; style?: CSSProperties };
/** A decorative, non-interactive border highlight. Parent must use position:relative + overflow:hidden + border-radius. */
export function BorderTrail({ size = 100, className = "", style }: BorderTrailProps) {
  return <span aria-hidden="true" className={`${styles.trail} ${className}`} style={{ "--trail-size": `${Math.max(16, Math.min(240, size))}px`, ...style } as CSSProperties}/>;
}
