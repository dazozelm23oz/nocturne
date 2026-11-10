import React, { useRef, useEffect, useState, useCallback } from "react";
import { WaveformStyleOption } from "@/typings/LyricsSettings";

function toRgba(color: string, alpha: number): string {
  if (!color) return `rgba(255, 255, 255, ${alpha})`;
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16) || 255;
    const g = parseInt(hex.slice(2, 4), 16) || 255;
    const b = parseInt(hex.slice(4, 6), 16) || 255;
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

interface RiffWavyProgressBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (targetSeconds: number) => void;
  primaryColor?: string;
  isLightMode?: boolean;
  waveformStyle?: WaveformStyleOption;
  isSkipping?: boolean;
  isSeeking?: boolean;
}

export default function RiffWavyProgressBar({
  currentTime,
  duration,
  isPlaying,
  onSeek,
  primaryColor = "#ffffff",
  isLightMode = false,
  waveformStyle = "Squiggly Wave",
  isSkipping = false,
  isSeeking = false,
}: RiffWavyProgressBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragProgress, setDragProgress] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Animation & physics state references
  const animStateRef = useRef({
    scrubPhase: 0,
    scrubProgress: 0,
    scrubKnobAnim: 0,
    scrubPrevKnobX: null as number | null,
    lastTime: 0,
  });

  const durationRef = useRef(duration);
  durationRef.current = duration;

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying && !isSkipping && !isSeeking;

  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const dragProgressRef = useRef(dragProgress);
  dragProgressRef.current = dragProgress;

  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;

  const getProgressFromPointer = useCallback(
    (clientX: number): number => {
      const container = containerRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const pct = getProgressFromPointer(e.clientX);
    setIsDragging(true);
    setDragProgress(pct);
    animStateRef.current.scrubProgress = pct;

    if (durationRef.current > 0) {
      onSeek(pct * durationRef.current);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const pct = getProgressFromPointer(e.clientX);
    setDragProgress(pct);
    animStateRef.current.scrubProgress = pct;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const pct = getProgressFromPointer(e.clientX);
    setIsDragging(false);

    if (durationRef.current > 0) {
      onSeek(pct * durationRef.current);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const sw = rect.width;
      const sh = rect.height;

      ctx.clearRect(0, 0, sw, sh);

      const anim = animStateRef.current;
      const dt =
        anim.lastTime === 0
          ? 0.016
          : Math.min((time - anim.lastTime) / 1000, 0.1);
      anim.lastTime = time;

      const dur = durationRef.current;
      const cur = isDraggingRef.current
        ? dragProgressRef.current * dur
        : currentTimeRef.current;

      const targetProgress =
        dur > 0 ? Math.max(0, Math.min(1, cur / dur)) : 0;
      const followSpeed = isDraggingRef.current ? 36 : 28;
      anim.scrubProgress +=
        (targetProgress - anim.scrubProgress) * Math.min(1, dt * followSpeed);
      anim.scrubProgress = Math.max(
        0,
        Math.min(1, Number.isFinite(anim.scrubProgress) ? anim.scrubProgress : 0)
      );

      // Target knob stretch on drag or hover
      const targetAnim = isDraggingRef.current
        ? 1.0
        : isHoveredRef.current
        ? 0.5
        : 0;
      anim.scrubKnobAnim +=
        (targetAnim - anim.scrubKnobAnim) * Math.min(1, dt * 14);

      // Capsule knob dimensions (Riff signature proportions)
      const curKnobW = 6.5 + (8.5 - 6.5) * anim.scrubKnobAnim;
      const curKnobH = 16 + (24 - 16) * anim.scrubKnobAnim;
      const curKnobR = curKnobW / 2;

      const padLeft = 4;
      const padRight = 4;
      const trackWidth = Math.max(10, sw - padLeft - padRight);
      const knobCenterX = Math.max(
        padLeft,
        Math.min(sw - padRight, padLeft + anim.scrubProgress * trackWidth)
      );

      if (anim.scrubPrevKnobX === null) anim.scrubPrevKnobX = knobCenterX;
      const deltaX = knobCenterX - anim.scrubPrevKnobX;
      anim.scrubPrevKnobX = knobCenterX;

      // Mathematical wave constants (Riff signature 42px wavelength)
      const isFluidSine = waveformStyle === "Fluid Sine Wave";
      const wavelength = isFluidSine ? 56 : 42;
      const k = (2 * Math.PI) / wavelength;
      const waveAmplitude = isFluidSine ? 3.8 : 4.6;

      if (isDraggingRef.current) {
        anim.scrubPhase += deltaX * k;
      } else if (isPlayingRef.current) {
        anim.scrubPhase += (isFluidSine ? 2.6 : 3.5) * dt;
      }

      const capRadius = 3;
      const knobLeft = knobCenterX - curKnobW / 2;
      const waveStart = padLeft;
      const waveEnd = Math.max(waveStart, knobLeft - 2 - capRadius);

      const bgStartX = Math.min(sw - padRight, knobCenterX + curKnobW / 2 + 3);
      const bgEndX = sw - padRight;

      const centerY = sh / 2;

      const fillColor = primaryColor || (isLightMode ? "#0f172a" : "#ffffff");
      const dimTrackColor = isLightMode
        ? "rgba(15, 23, 42, 0.18)"
        : "rgba(255, 255, 255, 0.22)";

      // 1. Draw Unplayed Track Rail (Right side)
      if (bgStartX < bgEndX - 1) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = dimTrackColor;
        ctx.moveTo(bgStartX, centerY);
        ctx.lineTo(bgEndX, centerY);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Played Squiggly Wave / Flat Line (Left side)
      if (waveEnd > waveStart) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = fillColor;

        // If paused and not dragging, or seek flat
        const shouldBeFlat = !isPlayingRef.current && !isDraggingRef.current;

        if (shouldBeFlat) {
          // Flatten smoothly
          ctx.moveTo(waveStart, centerY);
          ctx.lineTo(waveEnd, centerY);
          ctx.stroke();
        } else {
          // Authentic Riff Squiggly Wave algorithm
          const step = 2;
          for (let x = waveStart; x <= waveEnd; x += step) {
            const angle = anim.scrubPhase - (waveEnd - x) * k;
            const y = centerY + Math.sin(angle) * waveAmplitude;
            if (x === waveStart) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          const finalY = centerY + Math.sin(anim.scrubPhase) * waveAmplitude;
          ctx.lineTo(waveEnd, finalY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw Riff Signature Capsule Scrub Knob
      ctx.save();
      ctx.beginPath();
      const topY = centerY - curKnobH / 2;

      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(knobLeft, topY, curKnobW, curKnobH, curKnobR);
      } else {
        // Fallback rounded rect
        ctx.moveTo(knobLeft + curKnobR, topY);
        ctx.lineTo(knobLeft + curKnobW - curKnobR, topY);
        ctx.quadraticCurveTo(knobLeft + curKnobW, topY, knobLeft + curKnobW, topY + curKnobR);
        ctx.lineTo(knobLeft + curKnobW, topY + curKnobH - curKnobR);
        ctx.quadraticCurveTo(
          knobLeft + curKnobW,
          topY + curKnobH,
          knobLeft + curKnobW - curKnobR,
          topY + curKnobH
        );
        ctx.lineTo(knobLeft + curKnobR, topY + curKnobH);
        ctx.quadraticCurveTo(knobLeft, topY + curKnobH, knobLeft, topY + curKnobH - curKnobR);
        ctx.lineTo(knobLeft, topY + curKnobR);
        ctx.quadraticCurveTo(knobLeft, topY, knobLeft + curKnobR, topY);
      }

      ctx.fillStyle = fillColor;
      ctx.shadowColor = toRgba(fillColor, isDraggingRef.current ? 0.7 : 0.4);
      ctx.shadowBlur = isDraggingRef.current ? 12 : 6;
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [primaryColor, isLightMode, waveformStyle]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        height: 28,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        touchAction: "none",
        userSelect: "none",
      }}
      title="Seek playback"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
