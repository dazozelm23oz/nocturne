import React, { useEffect, useRef } from "react";
import { PaletteColors } from "@/lib/paletteExtractor";

interface FluidAuroraMeshProps {
  palette?: PaletteColors | null;
  isPlaying: boolean;
  isLightMode?: boolean;
}

export default function FluidAuroraMesh({
  palette,
  isPlaying,
  isLightMode = false,
}: FluidAuroraMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);

  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let internalW = 0;
    let internalH = 0;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;

      // Downscaled internal buffer (max 960x540) creates natural silkiness with virtually 0 GPU fill-rate overhead
      const scale = Math.min(1, 800 / Math.max(1, width));
      internalW = Math.max(120, Math.floor(width * scale));
      internalH = Math.max(80, Math.floor(height * scale));

      canvas.width = internalW;
      canvas.height = internalH;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const parseColor = (col: string | undefined, fallback: [number, number, number]): [number, number, number] => {
      if (!col) return fallback;
      if (col.startsWith("#")) {
        let hex = col.slice(1);
        if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
        const num = parseInt(hex, 16);
        if (isNaN(num)) return fallback;
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
      if (col.startsWith("rgb")) {
        const m = col.match(/\d+/g);
        if (m && m.length >= 3) {
          return [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])];
        }
      }
      return fallback;
    };

    const c1 = parseColor(palette?.primary, isLightMode ? [99, 102, 241] : [79, 70, 229]);
    const c2 = parseColor(palette?.secondary, isLightMode ? [236, 72, 153] : [219, 39, 119]);
    const c3 = parseColor(palette?.glow, isLightMode ? [6, 182, 212] : [14, 165, 233]);

    let phase = 0;
    let isVisible = !document.hidden;

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && isPlayingRef.current && !animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const step = 8; // Step in pixels for smooth wave polygon without excessive vertex computation

    const render = () => {
      if (!ctx || internalW <= 0 || internalH <= 0) return;

      if (isPlayingRef.current) {
        phase += 0.012;
      }

      ctx.clearRect(0, 0, internalW, internalH);

      // Save context state for composite blending
      ctx.save();
      ctx.globalCompositeOperation = isLightMode ? "multiply" : "screen";

      // Wave Layer 1: Deep Primary Harmonic Flow
      const yBase1 = internalH * 0.42;
      const grad1 = ctx.createLinearGradient(0, yBase1 - 80, internalW, yBase1 + 120);
      const a1 = isLightMode ? 0.16 : 0.42;
      grad1.addColorStop(0, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, ${a1})`);
      grad1.addColorStop(0.5, `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, ${a1 * 0.6})`);
      grad1.addColorStop(1, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0)`);

      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.moveTo(0, internalH);
      for (let x = 0; x <= internalW; x += step) {
        const y =
          yBase1 +
          Math.sin(x * 0.008 + phase * 0.9) * 24 +
          Math.cos(x * 0.004 - phase * 0.5) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(internalW, internalH);
      ctx.closePath();
      ctx.fill();

      // Wave Layer 2: Counter-Drifting Secondary Wave
      const yBase2 = internalH * 0.58;
      const grad2 = ctx.createLinearGradient(internalW, yBase2 - 70, 0, yBase2 + 100);
      const a2 = isLightMode ? 0.14 : 0.36;
      grad2.addColorStop(0, `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, ${a2})`);
      grad2.addColorStop(0.6, `rgba(${c3[0]}, ${c3[1]}, ${c3[2]}, ${a2 * 0.5})`);
      grad2.addColorStop(1, `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, 0)`);

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.moveTo(0, internalH);
      for (let x = 0; x <= internalW; x += step) {
        const y =
          yBase2 +
          Math.sin(x * 0.006 - phase * 1.1) * 26 +
          Math.sin(x * 0.012 + phase * 0.7) * 14;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(internalW, internalH);
      ctx.closePath();
      ctx.fill();

      // Wave Layer 3: High-Frequency Shimmer Crest
      const yBase3 = internalH * 0.34;
      const grad3 = ctx.createLinearGradient(0, yBase3 - 60, internalW, yBase3 + 80);
      const a3 = isLightMode ? 0.12 : 0.32;
      grad3.addColorStop(0, `rgba(${c3[0]}, ${c3[1]}, ${c3[2]}, ${a3})`);
      grad3.addColorStop(0.7, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, ${a3 * 0.4})`);
      grad3.addColorStop(1, `rgba(${c3[0]}, ${c3[1]}, ${c3[2]}, 0)`);

      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.moveTo(0, internalH);
      for (let x = 0; x <= internalW; x += step) {
        const y =
          yBase3 +
          Math.cos(x * 0.009 + phase * 1.3) * 20 +
          Math.sin(x * 0.005 + phase * 0.8) * 16;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(internalW, internalH);
      ctx.closePath();
      ctx.fill();

      // Ambient Central Aurora Flare (Gentle breathing orb in center)
      const centerX = internalW * (0.5 + Math.sin(phase * 0.4) * 0.12);
      const centerY = internalH * (0.45 + Math.cos(phase * 0.35) * 0.1);
      const flareRadius = Math.max(internalW, internalH) * 0.5;
      const flareGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        flareRadius
      );
      const aFlare = isLightMode ? 0.1 : 0.28;
      flareGrad.addColorStop(0, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, ${aFlare})`);
      flareGrad.addColorStop(0.5, `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, ${aFlare * 0.45})`);
      flareGrad.addColorStop(1, `rgba(${c3[0]}, ${c3[1]}, ${c3[2]}, 0)`);

      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, internalW, internalH);

      ctx.restore();

      if (isPlayingRef.current && isVisible) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    render();
    if (isPlaying && isVisible) {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [palette, isPlaying, isLightMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        filter: isLightMode ? "blur(20px)" : "blur(28px)", // Gentle hardware bicubic blur
        transform: "scale(1.08)", // Compensate for edge blur
        contain: "strict",
      }}
    />
  );
}
