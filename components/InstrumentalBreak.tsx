import React, { memo } from "react";
import styles from "@/styles/AppleMusic.module.css";

interface InstrumentalBreakProps {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  onSeek?: (seconds: number) => void;
  targetSeconds?: number;
  primaryColor?: string;
  isLightMode?: boolean;
}

const InstrumentalBreak = memo(function InstrumentalBreak({
  remainingSeconds,
  totalSeconds,
  isActive,
  onSeek,
  targetSeconds,
  primaryColor = "#38bdf8",
  isLightMode = false,
}: InstrumentalBreakProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof targetSeconds === "number" && onSeek) {
      onSeek(targetSeconds);
    }
  };

  const roundedRemaining = Math.max(0, Math.ceil(remainingSeconds));
  const progressRatio =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds))
      : 0;

  const soloLabel = totalSeconds >= 14 ? "Guitar Solo" : "Instrumental";

  return (
    <div
      onClick={handleClick}
      className={`${styles.instrumentalBreakWrapper} ${
        isActive
          ? styles.instrumentalBreakActive
          : styles.instrumentalBreakInactive
      }`}
      style={
        {
          "--break-accent": primaryColor,
        } as React.CSSProperties
      }
      title={
        isActive
          ? `${soloLabel}: ~${roundedRemaining}s remaining (Click to jump to vocals)`
          : "Instrumental Break"
      }
      role="button"
      tabIndex={0}
    >
      <div className={styles.instrumentalBreakPill}>
        {/* Animated Three Glowing Pulsing Dots (•••) */}
        <div className={styles.breakDotsRow}>
          <span
            className={`${styles.breakDot} ${styles.dot1} ${
              isActive ? styles.dotPulsing : ""
            }`}
          />
          <span
            className={`${styles.breakDot} ${styles.dot2} ${
              isActive ? styles.dotPulsing : ""
            }`}
          />
          <span
            className={`${styles.breakDot} ${styles.dot3} ${
              isActive ? styles.dotPulsing : ""
            }`}
          />
        </div>

        {/* Dynamic Countdown Text when Active */}
        {isActive && (
          <div className={styles.breakCountdownInfo}>
            <span className={styles.breakLabel}>{soloLabel}</span>
            <span className={styles.breakCountdownBadge}>
              {roundedRemaining}s
            </span>
          </div>
        )}

        {/* Micro progress line filling up towards next vocal line */}
        {isActive && (
          <div
            className={styles.breakProgressBar}
            style={{
              width: `${(progressRatio * 100).toFixed(1)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
});

export default InstrumentalBreak;
