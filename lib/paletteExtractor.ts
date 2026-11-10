import { PaletteAlgorithmOption } from "@/typings/LyricsSettings";

export interface PaletteColors {
  primary: string;
  secondary: string;
  tertiary?: string;
  quaternary?: string;
  paletteList?: string[];
  glow: string;
  overlayGradient: string;
  isLight: boolean;
  m3?: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    outline: string;
    inverseSurface: string;
    inverseOnSurface: string;
    inversePrimary: string;
    elevationLevel1: string;
    elevationLevel2: string;
    elevationLevel3: string;
    elevationLevel4: string;
  };
}

const cache = new Map<string, PaletteColors>();

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (isNaN(bigint)) return [225, 29, 72];
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function adjustLightness(r: number, g: number, b: number, factor: number): string {
  return rgbToHex(r * factor, g * factor, b * factor);
}

function generateM3TonalPalette(r: number, g: number, b: number, isLightMode: boolean) {
  const baseHex = rgbToHex(r, g, b);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isCurrentlyLight = lum > 0.55;

  if (isLightMode) {
    return {
      primary: isCurrentlyLight ? adjustLightness(r, g, b, 0.65) : baseHex,
      onPrimary: "#ffffff",
      primaryContainer: adjustLightness(r, g, b, 1.45),
      onPrimaryContainer: adjustLightness(r, g, b, 0.4),
      secondary: adjustLightness(r * 0.7, g * 0.75, b * 0.8, 0.8),
      onSecondary: "#ffffff",
      secondaryContainer: adjustLightness(r, g, b, 1.55),
      onSecondaryContainer: "#1e293b",
      tertiary: rgbToHex(Math.min(255, b + 30), Math.min(255, r + 20), Math.min(255, g + 10)),
      onTertiary: "#ffffff",
      surface: "#f8fafc",
      onSurface: "#0f172a",
      surfaceVariant: "#e2e8f0",
      onSurfaceVariant: "#475569",
      outline: "#94a3b8",
      inverseSurface: "#1e293b",
      inverseOnSurface: "#f1f5f9",
      inversePrimary: adjustLightness(r, g, b, 1.3),
      elevationLevel1: "rgba(0, 0, 0, 0.04)",
      elevationLevel2: "rgba(0, 0, 0, 0.07)",
      elevationLevel3: "rgba(0, 0, 0, 0.11)",
      elevationLevel4: "rgba(0, 0, 0, 0.15)",
    };
  } else {
    return {
      primary: isCurrentlyLight ? baseHex : adjustLightness(r, g, b, 1.35),
      onPrimary: "#0f172a",
      primaryContainer: adjustLightness(r, g, b, 0.55),
      onPrimaryContainer: "#f8fafc",
      secondary: adjustLightness(r * 0.8, g * 0.85, b * 0.9, 1.15),
      onSecondary: "#0f172a",
      secondaryContainer: adjustLightness(r, g, b, 0.45),
      onSecondaryContainer: "#f1f5f9",
      tertiary: rgbToHex(Math.min(255, b + 50), Math.min(255, r + 40), Math.min(255, g + 30)),
      onTertiary: "#0f172a",
      surface: "#090d16",
      onSurface: "#f8fafc",
      surfaceVariant: "#1e293b",
      onSurfaceVariant: "#cbd5e1",
      outline: "#64748b",
      inverseSurface: "#f1f5f9",
      inverseOnSurface: "#0f172a",
      inversePrimary: adjustLightness(r, g, b, 0.75),
      elevationLevel1: "rgba(255, 255, 255, 0.04)",
      elevationLevel2: "rgba(255, 255, 255, 0.07)",
      elevationLevel3: "rgba(255, 255, 255, 0.11)",
      elevationLevel4: "rgba(255, 255, 255, 0.15)",
    };
  }
}

export function extractPalette(
  imageUrl: string,
  algorithm: PaletteAlgorithmOption = "Auto (Beta)"
): Promise<PaletteColors> {
  const cacheKey = `${imageUrl}_${algorithm}`;
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey)!);
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(getDefaultPalette(algorithm));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(getDefaultPalette(algorithm));
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const pixels: [number, number, number][] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a > 128) {
            pixels.push([r, g, b]);
          }
        }

        let result: PaletteColors;
        switch (algorithm) {
          case "KMeans":
            result = computeKMeans(pixels);
            break;
          case "OctTree":
            result = computeOctTree(pixels);
            break;
          case "MedianCut (Preset 1)":
            result = computeMedianCut(pixels, 1);
            break;
          case "MedianCut (Preset 2)":
            result = computeMedianCut(pixels, 2);
            break;
          case "Auto (Beta)":
          default:
            result = computeAuto(pixels);
            break;
        }

        cache.set(cacheKey, result);
        resolve(result);
      } catch (err) {
        console.warn("Palette extraction failed, falling back", err);
        resolve(getDefaultPalette(algorithm));
      }
    };

    img.onerror = () => {
      resolve(getDefaultPalette(algorithm));
    };
  });
}

function computeAuto(pixels: [number, number, number][]): PaletteColors {
  const scoredPixels: { r: number; g: number; b: number; score: number }[] = [];

  for (const [r, g, b] of pixels) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = (max + min) / 510;
    // Prefer saturated mid-luminance colors
    const score = sat * 2.2 + (1 - Math.abs(lum - 0.5));
    scoredPixels.push({ r, g, b, score });
  }

  scoredPixels.sort((a, b) => b.score - a.score);

  // Extract up to 4 distinct vibrant hues with noticeable chromatic distance
  const distinctColors: [number, number, number][] = [];
  for (const p of scoredPixels) {
    const isDistinct = distinctColors.every(([dr, dg, db]) => {
      const dist = Math.sqrt((p.r - dr) ** 2 + (p.g - dg) ** 2 + (p.b - db) ** 2);
      return dist > 55;
    });
    if (isDistinct) {
      distinctColors.push([p.r, p.g, p.b]);
      if (distinctColors.length >= 4) break;
    }
  }

  const [bestR, bestG, bestB] = distinctColors[0] || [225, 29, 72];
  const sec = distinctColors[1] || [Math.round(bestR * 0.4), Math.round(bestG * 0.4), Math.round(bestB * 0.4)];
  const ter = distinctColors[2] || [Math.round(bestR * 0.7 + sec[0] * 0.3), Math.round(bestG * 0.7 + sec[1] * 0.3), Math.round(bestB * 0.7 + sec[2] * 0.3)];
  const quat = distinctColors[3] || [Math.round(bestR * 0.3 + 120), Math.round(bestG * 0.3 + 120), Math.round(bestB * 0.3 + 120)];

  const primary = `rgb(${bestR}, ${bestG}, ${bestB})`;
  const secondary = `rgb(${sec[0]}, ${sec[1]}, ${sec[2]})`;
  const tertiary = `rgb(${ter[0]}, ${ter[1]}, ${ter[2]})`;
  const quaternary = `rgb(${quat[0]}, ${quat[1]}, ${quat[2]})`;
  const paletteList = [primary, secondary, tertiary, quaternary];

  const glow = `rgba(${bestR}, ${bestG}, ${bestB}, 0.45)`;
  const overlayGradient = `radial-gradient(circle at 35% 50%, rgba(${bestR}, ${bestG}, ${bestB}, 0.22) 0%, rgba(12, 12, 14, 0.85) 100%)`;
  const isLight = (0.2126 * bestR + 0.7152 * bestG + 0.0722 * bestB) / 255 > 0.55;

  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(bestR, bestG, bestB, isLight) };
}

function computeKMeans(pixels: [number, number, number][]): PaletteColors {
  let c1 = pixels[0] || [200, 50, 50];
  let c2 = pixels[Math.floor(pixels.length / 2)] || [50, 150, 200];
  let c3 = pixels[pixels.length - 1] || [50, 200, 100];

  const getSat = (c: [number, number, number]) => {
    const max = Math.max(c[0], c[1], c[2]);
    const min = Math.min(c[0], c[1], c[2]);
    return max === 0 ? 0 : (max - min) / max;
  };

  const centroids = [c1, c2, c3].sort((a, b) => getSat(b) - getSat(a));
  const chosen = centroids[0];

  const primary = `rgb(${chosen[0]}, ${chosen[1]}, ${chosen[2]})`;
  const secondary = `rgb(${Math.round(chosen[0] * 0.35)}, ${Math.round(chosen[1] * 0.35)}, ${Math.round(chosen[2] * 0.35)})`;
  const tertiary = `rgb(${centroids[1]?.[0] || 150}, ${centroids[1]?.[1] || 150}, ${centroids[1]?.[2] || 150})`;
  const quaternary = `rgb(${centroids[2]?.[0] || 100}, ${centroids[2]?.[1] || 100}, ${centroids[2]?.[2] || 100})`;
  const paletteList = [primary, secondary, tertiary, quaternary];
  const glow = `rgba(${chosen[0]}, ${chosen[1]}, ${chosen[2]}, 0.55)`;
  const overlayGradient = `radial-gradient(circle at 40% 45%, rgba(${chosen[0]}, ${chosen[1]}, ${chosen[2]}, 0.32) 0%, rgba(10, 10, 12, 0.9) 100%)`;
  const isLight = (0.2126 * chosen[0] + 0.7152 * chosen[1] + 0.0722 * chosen[2]) / 255 > 0.55;

  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(chosen[0], chosen[1], chosen[2], isLight) };
}

function computeOctTree(pixels: [number, number, number][]): PaletteColors {
  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  for (const [r, g, b] of pixels) {
    const key = ((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6);
    const curr = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    curr.r += r;
    curr.g += g;
    curr.b += b;
    curr.count++;
    buckets.set(key, curr);
  }

  let topBucket = { r: 100, g: 100, b: 100, count: 1 };
  buckets.forEach((b) => {
    if (b.count > topBucket.count) topBucket = b;
  });

  const r = Math.round(topBucket.r / topBucket.count);
  const g = Math.round(topBucket.g / topBucket.count);
  const b = Math.round(topBucket.b / topBucket.count);

  const primary = `rgb(${r}, ${g}, ${b})`;
  const secondary = `rgb(${Math.round(r * 0.3)}, ${Math.round(g * 0.3)}, ${Math.round(b * 0.3)})`;
  const tertiary = `rgb(${Math.round(r * 0.8 + 30)}, ${Math.round(g * 0.8 + 20)}, ${Math.round(b * 0.8 + 10)})`;
  const quaternary = `rgb(${Math.round(r * 0.6 + 50)}, ${Math.round(g * 0.5 + 40)}, ${Math.round(b * 0.4 + 30)})`;
  const paletteList = [primary, secondary, tertiary, quaternary];
  const glow = `rgba(${r}, ${g}, ${b}, 0.4)`;
  const overlayGradient = `radial-gradient(circle at 30% 50%, rgba(${r}, ${g}, ${b}, 0.28) 0%, rgba(8, 8, 10, 0.88) 100%)`;
  const isLight = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55;

  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };
}

function computeMedianCut(
  pixels: [number, number, number][],
  preset: 1 | 2
): PaletteColors {
  const sorted = [...pixels].sort((a, b) =>
    preset === 1 ? b[0] + b[1] - (a[0] + a[1]) : b[2] - a[2]
  );
  const target = sorted[Math.floor(sorted.length * (preset === 1 ? 0.25 : 0.75))] || [
    128, 128, 128,
  ];

  const primary = `rgb(${target[0]}, ${target[1]}, ${target[2]})`;
  const secondary = `rgb(${Math.round(target[0] * 0.3)}, ${Math.round(target[1] * 0.3)}, ${Math.round(target[2] * 0.3)})`;
  const tertiary = `rgb(${Math.round(target[0] * 0.85)}, ${Math.round(target[1] * 0.7)}, ${Math.round(target[2] * 0.6)})`;
  const quaternary = `rgb(${Math.round(target[0] * 0.5 + 40)}, ${Math.round(target[1] * 0.6 + 20)}, ${Math.round(target[2] * 0.5)})`;
  const paletteList = [primary, secondary, tertiary, quaternary];
  const glow = `rgba(${target[0]}, ${target[1]}, ${target[2]}, 0.5)`;
  const overlayGradient =
    preset === 1
      ? `radial-gradient(circle at 35% 45%, rgba(${target[0]}, ${target[1]}, ${target[2]}, 0.35) 0%, rgba(14, 14, 16, 0.82) 100%)`
      : `radial-gradient(circle at 50% 50%, rgba(${target[0]}, ${target[1]}, ${target[2]}, 0.2) 0%, rgba(6, 6, 8, 0.92) 100%)`;
  const isLight = (0.2126 * target[0] + 0.7152 * target[1] + 0.0722 * target[2]) / 255 > 0.55;

  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };
}

function getDefaultPalette(algorithm: PaletteAlgorithmOption): PaletteColors {
  const pal = getDefaultPaletteRaw(algorithm);
  const rgb = pal.primary.startsWith("#") ? [
    parseInt(pal.primary.slice(1, 3), 16),
    parseInt(pal.primary.slice(3, 5), 16),
    parseInt(pal.primary.slice(5, 7), 16)
  ] : [225, 29, 72];
  return { ...pal, m3: generateM3TonalPalette(rgb[0], rgb[1], rgb[2], pal.isLight) };
}

function getDefaultPaletteRaw(algorithm: PaletteAlgorithmOption): PaletteColors {
  switch (algorithm) {
    case "KMeans":
      return {
        primary: "#e11d48",
        secondary: "#4c0519",
        tertiary: "#f43f5e",
        quaternary: "#9f1239",
        paletteList: ["#e11d48", "#4c0519", "#f43f5e", "#9f1239"],
        glow: "rgba(225, 29, 72, 0.45)",
        overlayGradient:
          "radial-gradient(circle at 35% 50%, rgba(225, 29, 72, 0.25) 0%, rgba(10, 10, 12, 0.88) 100%)",
        isLight: false,
      };
    case "OctTree":
      return {
        primary: "#8b5cf6",
        secondary: "#2e1065",
        tertiary: "#a855f7",
        quaternary: "#6d28d9",
        paletteList: ["#8b5cf6", "#2e1065", "#a855f7", "#6d28d9"],
        glow: "rgba(139, 92, 246, 0.45)",
        overlayGradient:
          "radial-gradient(circle at 35% 50%, rgba(139, 92, 246, 0.25) 0%, rgba(10, 10, 12, 0.88) 100%)",
        isLight: false,
      };
    case "MedianCut (Preset 1)":
      return {
        primary: "#10b981",
        secondary: "#064e3b",
        tertiary: "#34d399",
        quaternary: "#059669",
        paletteList: ["#10b981", "#064e3b", "#34d399", "#059669"],
        glow: "rgba(16, 185, 129, 0.45)",
        overlayGradient:
          "radial-gradient(circle at 35% 50%, rgba(16, 185, 129, 0.25) 0%, rgba(10, 10, 12, 0.88) 100%)",
        isLight: false,
      };
    case "MedianCut (Preset 2)":
      return {
        primary: "#f59e0b",
        secondary: "#451a03",
        tertiary: "#fbbf24",
        quaternary: "#d97706",
        paletteList: ["#f59e0b", "#451a03", "#fbbf24", "#d97706"],
        glow: "rgba(245, 158, 11, 0.45)",
        overlayGradient:
          "radial-gradient(circle at 35% 50%, rgba(245, 158, 11, 0.25) 0%, rgba(10, 10, 12, 0.88) 100%)",
        isLight: false,
      };
    case "Auto (Beta)":
    default:
      return {
        primary: "#ff4081",
        secondary: "#3b0764",
        tertiary: "#f59e0b",
        quaternary: "#ec4899",
        paletteList: ["#ff4081", "#3b0764", "#f59e0b", "#ec4899"],
        glow: "rgba(255, 64, 129, 0.35)",
        overlayGradient:
          "radial-gradient(circle at 35% 50%, rgba(255, 64, 129, 0.20) 0%, rgba(20, 10, 25, 0.88) 100%)",
        isLight: false,
      };
  }
}
