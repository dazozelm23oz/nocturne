import React from "react";
import styles from "@/styles/AppleMusic.module.css";
import { VinylStyleOption } from "@/typings/LyricsSettings";

interface VinylTurntableProps {
  songImage: string;
  isPlaying: boolean;
  trackName: string;
  onTogglePlay?: (e?: React.MouseEvent) => void;
  isLightMode?: boolean;
  hasEdgeGlow?: boolean;
  primaryColor?: string;
  vinylStyle?: VinylStyleOption;
}

export default function VinylTurntable({
  songImage,
  isPlaying,
  trackName,
  onTogglePlay,
  isLightMode = false,
  hasEdgeGlow = true,
  primaryColor = "#38bdf8",
  vinylStyle = "Turntable Deck",
}: VinylTurntableProps) {
  // Common Tonearm Assembly component for both modes
  const renderTonearm = (customClassName?: string) => (
    <div
      className={`${styles.tonearmAssembly} ${
        isPlaying ? styles.tonearmPlaying : styles.tonearmResting
      } ${customClassName || ""}`}
    >
      <div className={styles.tonearmPivotBase}>
        <div className={styles.tonearmCounterweight} />
      </div>
      <div className={styles.tonearmShaft} />
      <div className={styles.tonearmHeadshell}>
        <div className={styles.tonearmNeedleTip} />
      </div>
    </div>
  );

  // Common Spinning Grooved Vinyl Disc component
  const renderVinylDisc = () => (
    <div
      className={`${styles.vinylRecord} ${
        isPlaying ? styles.vinylSpinning : styles.vinylStatic
      }`}
    >
      {/* Dual Anisotropic Light Sheen Flare */}
      <div className={styles.vinylLightSheen} />

      {/* Concentric Micro-Grooves */}
      <div className={styles.vinylGrooves} />

      {/* Center Record Label with Album Art */}
      <div className={styles.vinylCenterLabel}>
        <img
          src={songImage}
          alt={trackName}
          className={styles.vinylLabelArtwork}
          loading="lazy"
        />
        {/* Center Brass Spindle Hole */}
        <div className={styles.vinylSpindleHole} />
      </div>
    </div>
  );

  if (vinylStyle === "Sleeve Slide-Out") {
    return (
      <div
        className={`${styles.vinylSleeveContainer} ${
          hasEdgeGlow ? styles.turntableEdgeGlow : ""
        } ${isPlaying ? styles.sleevePlaying : styles.sleevePaused}`}
        onClick={onTogglePlay}
        title={isPlaying ? "Click to Pause" : "Click to Play"}
        role="button"
        tabIndex={0}
        style={
          {
            "--turntable-accent": primaryColor,
          } as React.CSSProperties
        }
      >
        {/* Grooved Vinyl Record that slides out of sleeve */}
        <div
          className={`${styles.vinylSleeveDisc} ${
            isPlaying ? styles.discSlidOut : styles.discSlidIn
          }`}
        >
          {renderVinylDisc()}
        </div>

        {/* Cardboard Album Sleeve / Jacket */}
        <div className={styles.vinylSleeveJacket}>
          <div className={styles.vinylSleeveSpine} />
          <div className={styles.vinylSleeveGloss} />
          <img
            src={songImage}
            alt={trackName}
            className={styles.vinylSleeveArtwork}
            loading="lazy"
          />
          <div className={styles.vinylSleeveBadge}>33 RPM HI-FI</div>
        </div>

        {/* Animated Tonearm dropping onto slid-out disc */}
        {renderTonearm()}
      </div>
    );
  }

  // Default: Turntable Deck (Includes Platter, Tonearm, AND Album Sleeve Display)
  return (
    <div
      className={`${styles.turntableChassis} ${
        hasEdgeGlow ? styles.turntableEdgeGlow : ""
      } ${isPlaying ? styles.turntablePlaying : styles.turntablePaused}`}
      onClick={onTogglePlay}
      title={isPlaying ? "Click to Pause" : "Click to Play"}
      role="button"
      tabIndex={0}
      style={
        {
          "--turntable-accent": primaryColor,
        } as React.CSSProperties
      }
    >
      {/* Power LED Indicator & HI-FI Brand */}
      <div className={styles.turntablePowerLight}>
        <span
          className={`${styles.turntableLed} ${
            isPlaying ? styles.turntableLedActive : ""
          }`}
        />
        <span className={styles.turntableBrandLabel}>HI-FI VINYL • 33 RPM</span>
      </div>

      {/* Recessed Platter Well with Spinning Record */}
      <div className={styles.turntableWell}>
        {renderVinylDisc()}
      </div>

      {/* Realistic Animated Tonearm Assembly */}
      {renderTonearm()}
    </div>
  );
}
