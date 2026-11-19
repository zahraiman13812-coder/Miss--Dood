import Image from "next/image";
import styles from "./StoreLoading.module.css";

type StoreLoadingProps = {
  message?: string;
  compact?: boolean;
};

/** Shared loading state for route transitions and the customer's account dashboard. */
export default function StoreLoading({
  message = "در حال آماده‌سازی تجربه خرید شما…",
  compact = false,
}: StoreLoadingProps) {
  return (
    <div
      className={`${styles.scene} ${compact ? styles.compact : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className={styles.aura} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.monogram} aria-hidden="true">
          <div className={styles.orbit} />
          <div className={styles.orbitInner} />
          <span className={styles.starOne}>✦</span>
          <span className={styles.starTwo}>✦</span>
          <span className={styles.logoWrap}>
            <Image
              src="/brand/miss-dood-logo.jpg"
              alt=""
              width={112}
              height={112}
              className={styles.logo}
              priority
            />
          </span>
        </div>
        <p className={styles.brand}>MISS DOOD</p>
        <p className={styles.description}>{message}</p>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} />
        </div>
        <span className={styles.smallText}>انتخابی خاص، برای شما</span>
      </div>
    </div>
  );
}
