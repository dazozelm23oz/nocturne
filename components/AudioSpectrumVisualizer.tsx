import React, { useRef, useEffect } from "react";
import { SpectrumStyleOption } from "@/typings/LyricsSettings";

function toRgba(color: string, alpha: number): string {
  if (!color) return `rgba(56, 189, 248, ${alpha})`;
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }
  if (color.startsWith("rgba(")) {
    return color.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  return color;
}

interface AudioSpectrumVisualizerProps {
  isPlaying: boolean;
  primaryColor?: string;
  glowColor?: string;
  isLightMode?: boolean;
  spectrumStyle?: SpectrumStyleOption;
  analyserNode?: AnalyserNode | null;
}

export default function AudioSpectrumVisualizer({
  isPlaying,
  primaryColor = "#38bdf8",
  glowColor = "rgba(56, 189, 248, 0.35)",
  isLightMode = false,
  spectrumStyle = "Bars (Classic)",
  analyserNode = null,
}: AudioSpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const barCount = 36;
    const barHeights = new Float32Array(barCount).fill(4);
    let lastTime = performance.now();
    let lastRenderTime = 0;
    const fftData = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;

    let cachedWidth = 0;
    let cachedHeight = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      cachedWidth = rect.width;
      cachedHeight = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      // Frame throttle: don't render faster than ~60 FPS (min 16ms between frames)
      const elapsed = time - lastRenderTime;
      if (elapsed < 16) {
        return;
      }

      const width = cachedWidth;
      const height = cachedHeight;
      if (width <= 0 || height <= 0) return;

      ctx.clearRect(0, 0, width, height);

      const delta = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;
      lastRenderTime = time;

      // Derived FFT beat pulse when HQ audio analyser is active; procedural fallback for MPRIS
      let beatPulse = 0.1;
      if (analyserNode && fftData && isPlaying) {
        analyserNode.getByteFrequencyData(fftData);
        // Low bins (0-3) represent bass/kick energy
        const bassEnergy = (fftData[0] + fftData[1] + fftData[2] + fftData[3]) / (4 * 255);
        beatPulse = 0.4 + bassEnergy * 0.9;
      } else if (isPlaying) {
        beatPulse = 0.75 + Math.sin(time * 0.007) * 0.25 + (Math.sin(time * 0.014) > 0.8 ? 0.35 : 0);
      }

      const maxHeight = height * 0.85;

      // Update frequency heights with smooth interpolation
      for (let i = 0; i < barCount; i++) {
        const norm = i / barCount;
        const envelope = Math.sin(norm * Math.PI) * 0.85 + 0.15;

        let target = 3;
        if (analyserNode && fftData && isPlaying) {
          const binIndex = Math.min(fftData.length - 1, Math.floor((i / barCount) * (fftData.length * 0.6)));
          const rawEnergy = (fftData[binIndex] / 255) * envelope * beatPulse;
          target = Math.min(maxHeight, Math.max(4, rawEnergy * maxHeight));
        } else if (isPlaying) {
          const w1 = Math.sin(time * 0.004 + i * 0.32);
          const w2 = Math.cos(time * 0.006 - i * 0.28);
          const w3 = Math.sin(time * 0.01 + i * 0.65);
          const rawEnergy = Math.max(0.05, (w1 * 0.4 + w2 * 0.35 + w3 * 0.25 + 0.65) * envelope * beatPulse);
          target = Math.min(maxHeight, Math.max(4, rawEnergy * maxHeight));
        }

        barHeights[i] += (target - barHeights[i]) * Math.min(1, delta * 14);
      }

      if (spectrumStyle === "Waveform (Fluid)") {
        // --- Fluid Continuous Bezier Waveform Mode ---
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, toRgba(primaryColor, 0.45));
        grad.addColorStop(0.7, toRgba(primaryColor, 0.15));
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.moveTo(0, height);

        const step = width / (barCount - 1);
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < barCount; i++) {
          const x = i * step;
          const y = height - barHeights[i];
          points.push({ x, y });
        }

        // Draw smooth spline through points
        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke neon spine
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = toRgba(primaryColor, 0.95);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      } else if (spectrumStyle === "Ambient Pulse") {
        // --- Ambient Rhythmic Pulse Waves Mode ---
        ctx.save();
        const centerX = width / 2;
        const centerY = height * 0.7;
        const baseRadius = 24 + beatPulse * 28;

        for (let ring = 0; ring < 3; ring++) {
          const ringRad = baseRadius + ring * 22;
          const ringAlpha = Math.max(0.05, (0.55 - ring * 0.16) * (isPlaying ? 1 : 0.2));
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2);
          ctx.strokeStyle = toRgba(primaryColor, ringAlpha);
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Radial glowing aura
        const radialGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          baseRadius * 1.5
        );
        radialGrad.addColorStop(0, toRgba(primaryColor, 0.35));
        radialGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // --- Default: Bars (Classic) Mode ---
        const totalBarWidth = width / barCount;
        const barWidth = Math.max(3, totalBarWidth - 4);

        for (let i = 0; i < barCount; i++) {
          const h = barHeights[i];
          const x = i * totalBarWidth + (totalBarWidth - barWidth) / 2;
          const y = height - h;

          const grad = ctx.createLinearGradient(0, y, 0, height);
          if (isLightMode) {
            grad.addColorStop(0, toRgba(primaryColor, 0.95));
            grad.addColorStop(0.7, toRgba(primaryColor, 0.55));
            grad.addColorStop(1, "rgba(0, 0, 0, 0.04)");
          } else {
            grad.addColorStop(0, toRgba(primaryColor, 0.95));
            grad.addColorStop(0.65, toRgba(primaryColor, 0.75));
            grad.addColorStop(1, "rgba(255, 255, 255, 0.06)");
          }

          ctx.fillStyle = grad;
          const r = Math.min(barWidth / 2, 3);
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + barWidth - r, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
          ctx.lineTo(x + barWidth, height);
          ctx.lineTo(x, height);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();

          // Top glow cap
          if (isPlaying && h > 10) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y + 1.5, Math.min(1.8, barWidth / 3), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying, primaryColor, glowColor, isLightMode, spectrumStyle, analyserNode]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 70,
        pointerEvents: "none",
        zIndex: 5,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
        marginTop: "-10px",
        marginBottom: "12px",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: `drop-shadow(0 0 12px ${toRgba(glowColor || primaryColor, 0.4)})`,
        }}
      />
    </div>
  );
}
