import React, { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import styles from "@/styles/Signin.module.css";
import GruvboxIcon from "@/components/icons/GruvboxIcon";

export default function Signin() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Preparing secure session...");
  const animFrameRef = useRef<number | null>(null);

  const handleSpotifyLogin = () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setProgress(0);

    const startTime = performance.now();
    const durationMs = 1350; // Smooth 1.35s redirection progress animation

    const step = (now: number) => {
      const elapsed = now - startTime;
      const rawPct = Math.min(100, (elapsed / durationMs) * 100);

      // Smooth cubic-out easing curve for visual polish
      const t = rawPct / 100;
      const easedPct = Math.round((1 - Math.pow(1 - t, 2.5)) * 100);

      setProgress(easedPct);

      if (easedPct < 35) {
        setStatusText("Preparing secure session...");
      } else if (easedPct < 75) {
        setStatusText("Connecting to Spotify OAuth...");
      } else {
        setStatusText("Redirecting to Spotify...");
      }

      if (rawPct < 100) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Trigger NextAuth OAuth redirection immediately upon completion
        signIn("spotify", { callbackUrl: "/" });
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className={styles.signinContainer}>
      {/* Ambient background glows */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />
      <div className={styles.ambientOrb3} />

      {/* Main Glassmorphism Sign-in Card */}
      <div className={styles.signinCard}>
        {/* Brand Emblem */}
        <div className={styles.logoEmblemWrapper}>
          <div className={styles.logoGlowRing} />
          <div className={styles.logoBadge}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.684.472-1.042.254-2.857-1.745-6.453-2.14-10.688-1.173-.41.094-.816-.164-.91-.573-.094-.41.164-.816.573-.91 4.636-1.059 8.604-.611 11.813 1.36.358.218.472.684.254 1.042zm1.47-3.268c-.276.448-.86.59-1.308.314-3.27-2.01-8.254-2.593-12.122-1.418-.504.152-1.036-.134-1.19-.638-.152-.504.134-1.036.638-1.19 4.417-1.34 9.907-.69 13.668 1.624.448.276.59.86.314 1.308zm.126-3.41c-3.921-2.328-10.384-2.543-14.135-1.404-.6.182-1.236-.16-1.418-.76-.182-.6.16-1.236.76-1.418 4.312-1.309 11.448-1.057 15.96 1.622.54.32.716 1.026.396 1.566-.32.54-1.026.716-1.566.396z" />
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>Welcome to Nocturne</h1>
        <p className={styles.subtitle}>
          Immersive real-time synced lyrics, dynamic Apple Music typography, and fluid canvas audio visualizers.
        </p>

        {/* Feature Highlights */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <GruvboxIcon name="waves" size={17} />
            </div>
            <div className={styles.featureText}>
              <strong>Live Synced Karaoke</strong>
              <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)" }}>
                Sequential word-by-word wipe with 2D syllable follower
              </div>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <GruvboxIcon name="star" size={17} />
            </div>
            <div className={styles.featureText}>
              <strong>Liked Songs Integration</strong>
              <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)" }}>
                Contrast-adaptive star favorites synchronized with your library
              </div>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <GruvboxIcon name="thunderbolt" size={17} />
            </div>
            <div className={styles.featureText}>
              <strong>Zero-Latency SMTC Engine</strong>
              <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)" }}>
                Instant 0.1ms hardware media keys and local Windows bridge
              </div>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          type="button"
          onClick={handleSpotifyLogin}
          disabled={isConnecting}
          className={styles.spotifyBtn}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.684.472-1.042.254-2.857-1.745-6.453-2.14-10.688-1.173-.41.094-.816-.164-.91-.573-.094-.41.164-.816.573-.91 4.636-1.059 8.604-.611 11.813 1.36.358.218.472.684.254 1.042zm1.47-3.268c-.276.448-.86.59-1.308.314-3.27-2.01-8.254-2.593-12.122-1.418-.504.152-1.036-.134-1.19-.638-.152-.504.134-1.036.638-1.19 4.417-1.34 9.907-.69 13.668 1.624.448.276.59.86.314 1.308zm.126-3.41c-3.921-2.328-10.384-2.543-14.135-1.404-.6.182-1.236-.16-1.418-.76-.182-.6.16-1.236.76-1.418 4.312-1.309 11.448-1.057 15.96 1.622.54.32.716 1.026.396 1.566-.32.54-1.026.716-1.566.396z" />
          </svg>
          <span>{isConnecting ? "Connecting..." : "Sign in with Spotify"}</span>
        </button>

        {/* Loading Progress Bar to Redirection */}
        {isConnecting && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.statusText}>
                <span className={styles.pulseDot} />
                {statusText}
              </span>
              <span className={styles.progressPct}>{progress}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress}%` }}
              >
                <div className={styles.progressBarShimmer} />
              </div>
            </div>
          </div>
        )}

        {/* Secondary Actions */}
        <div className={styles.secondaryActions}>
          <Link href="/" className={styles.localModeBtn}>
            Continue in Local Mode (Offline SMTC)
          </Link>
        </div>

        {/* Footnote */}
        <p className={styles.footerNote}>
          By signing in, you grant read access to your active Spotify playback state.
          Your credentials remain strictly private and encrypted on your local machine.
        </p>
      </div>
    </div>
  );
}
