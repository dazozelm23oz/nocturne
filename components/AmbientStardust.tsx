import React, { useEffect, useRef } from "react";

interface AmbientStardustProps {
  isPlaying: boolean;
  primaryColor?: string;
  isLightMode?: boolean;
}

interface StardustParticle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vy: number;
  driftAmp: number;
  driftFreq: number;
}

export default function AmbientStardust({
  isPlaying,
  primaryColor = "#38bdf8",
  isLightMode = false,
}: AmbientStardustProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<StardustParticle[]>([]);
  const isPlayingRef = useRef<boolean>(isPlaying);

  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;

      // 1x device resolution is plenty for soft micro-particles and preserves memory
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));

      // Re-seed or adjust particles count (36-45 particles is optimal)
      const count = Math.min(48, Math.max(24, Math.floor(width / 32)));
      if (particlesRef.current.length === 0 || Math.abs(particlesRef.current.length - count) > 12) {
        const parts: StardustParticle[] = [];
        for (let i = 0; i < count; i++) {
          parts.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 0.6 + Math.random() * 1.5,
            baseAlpha: 0.15 + Math.random() * 0.55,
            twinkleSpeed: 0.018 + Math.random() * 0.035,
            twinklePhase: Math.random() * Math.PI * 2,
            vy: -0.12 - Math.random() * 0.28,
            driftAmp: 0.15 + Math.random() * 0.35,
            driftFreq: 0.008 + Math.random() * 0.015,
          });
        }
        particlesRef.current = parts;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let tick = 0;
    let isVisible = !document.hidden;

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && isPlayingRef.current && !animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Color conversion
    const hexToRgb = (hex: string): [number, number, number] => {
      let clean = hex.replace("#", "");
      if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
      const num = parseInt(clean, 16);
      if (isNaN(num)) return isLightMode ? [30, 41, 59] : [220, 240, 255];
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    };

    const [r, g, b] = hexToRgb(primaryColor);

    const render = () => {
      if (!ctx || width <= 0 || height <= 0) return;

      ctx.clearRect(0, 0, width, height);

      tick++;
      const parts = particlesRef.current;
      const len = parts.length;

      for (let i = 0; i < len; i++) {
        const p = parts[i];

        // Animate physics only if playing
        if (isPlayingRef.current) {
          p.y += p.vy;
          p.x += Math.sin(tick * p.driftFreq + p.twinklePhase) * p.driftAmp;
          p.twinklePhase += p.twinkleSpeed;

          // Wrap around seamlessly
          if (p.y < -10) {
            p.y = height + 8;
            p.x = Math.random() * width;
          } else if (p.y > height + 10) {
            p.y = -8;
          }
          if (p.x < -10) p.x = width + 8;
          else if (p.x > width + 10) p.x = -8;
        }

        // Calculate dynamic twinkle alpha
        const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
        const alpha = p.baseAlpha * (0.6 + 0.4 * twinkle) * (isLightMode ? 0.35 : 0.7);

        // Micro-particle halo glow
        const glowRadius = p.radius * 2.5;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp star core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = isLightMode
          ? `rgba(20, 20, 25, ${alpha * 0.9})`
          : `rgba(255, 255, 255, ${Math.min(1, alpha * 1.4)})`;
        ctx.fill();
      }

      if (isPlayingRef.current && isVisible) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    // Draw initial static frame or start loop
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
  }, [isPlaying, primaryColor, isLightMode]);

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
        zIndex: 1,
        contain: "strict",
      }}
    />
  );
}
