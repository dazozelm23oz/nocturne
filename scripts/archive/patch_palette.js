const fs = require('fs');
const filePath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/lib/paletteExtractor.ts';
let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const m3Interface = `export interface M3TonalPalette {
  surface: string;
  surfaceRgb: string;
  surfaceContainer: string;
  surfaceContainerRgb: string;
  primary: string;
  primaryRgb: string;
  onPrimary: string;
  onSurface: string;
  onSurfaceRgb: string;
  onSurfaceVariant: string;
  outline: string;
  outlineRgb: string;
  glow: string;
}

export interface PaletteColors {
  primary: string;
  secondary: string;
  glow: string;
  overlayGradient: string;
  isLight: boolean;
  m3?: M3TonalPalette;
}`;

code = code.replace(/export interface PaletteColors \{[\s\S]*?isLight: boolean;\n\}/, m3Interface);

const m3HelperCode = `
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function generateM3TonalPalette(r: number, g: number, b: number, isLight: boolean): M3TonalPalette {
  let [h, s, l] = rgbToHsl(r, g, b);

  // Intelligent Chroma Boost: Guard minimum saturation for monochrome/grayscale art
  if (s < 0.18) {
    s = 0.36;
    if (h === 0) h = 152; // Tasteful emerald
  }

  if (isLight) {
    const [sr, sg, sb] = hslToRgb(h, s * 0.28, 0.96);
    const [cr, cg, cb] = hslToRgb(h, s * 0.35, 0.90);
    const [pr, pg, pb] = hslToRgb(h, Math.min(1, s * 1.2), 0.38);
    const [outR, outG, outB] = hslToRgb(h, s * 0.3, 0.75);

    return {
      surface: \`rgb(\${sr}, \${sg}, \${sb})\`,
      surfaceRgb: \`\${sr}, \${sg}, \${sb}\`,
      surfaceContainer: \`rgb(\${cr}, \${cg}, \${cb})\`,
      surfaceContainerRgb: \`\${cr}, \${cg}, \${cb}\`,
      primary: \`rgb(\${pr}, \${pg}, \${pb})\`,
      primaryRgb: \`\${pr}, \${pg}, \${pb}\`,
      onPrimary: "#ffffff",
      onSurface: "#111113",
      onSurfaceRgb: "17, 17, 19",
      onSurfaceVariant: "rgba(20, 20, 24, 0.65)",
      outline: \`rgb(\${outR}, \${outG}, \${outB})\`,
      outlineRgb: \`\${outR}, \${outG}, \${outB}\`,
      glow: \`rgba(\${pr}, \${pg}, \${pb}, 0.35)\`,
    };
  } else {
    const [sr, sg, sb] = hslToRgb(h, s * 0.42, 0.08);
    const [cr, cg, cb] = hslToRgb(h, s * 0.52, 0.14);
    const [pr, pg, pb] = hslToRgb(h, Math.min(1, s * 1.25), 0.66);
    const [osR, osG, osB] = hslToRgb(h, s * 0.15, 0.94);
    const [osvR, osvG, osvB] = hslToRgb(h, s * 0.25, 0.72);
    const [outR, outG, outB] = hslToRgb(h, s * 0.45, 0.32);

    const onPrimary = (0.2126 * pr + 0.7152 * pg + 0.0722 * pb) > 135 ? "#0b0f19" : "#ffffff";

    return {
      surface: \`rgb(\${sr}, \${sg}, \${sb})\`,
      surfaceRgb: \`\${sr}, \${sg}, \${sb}\`,
      surfaceContainer: \`rgb(\${cr}, \${cg}, \${cb})\`,
      surfaceContainerRgb: \`\${cr}, \${cg}, \${cb}\`,
      primary: \`rgb(\${pr}, \${pg}, \${pb})\`,
      primaryRgb: \`\${pr}, \${pg}, \${pb}\`,
      onPrimary,
      onSurface: \`rgb(\${osR}, \${osG}, \${osB})\`,
      onSurfaceRgb: \`\${osR}, \${osG}, \${osB}\`,
      onSurfaceVariant: \`rgb(\${osvR}, \${osvG}, \${osvB})\`,
      outline: \`rgb(\${outR}, \${outG}, \${outB})\`,
      outlineRgb: \`\${outR}, \${outG}, \${outB}\`,
      glow: \`rgba(\${pr}, \${pg}, \${pb}, 0.45)\`,
    };
  }
}
`;

// Insert helper function before extractPalette
code = code.replace('export async function extractPalette(', m3HelperCode + '\nexport async function extractPalette(');

// Now patch each function that returns PaletteColors to include m3: generateM3TonalPalette(r, g, b, isLight)
// 1. in computeKMeans:
code = code.replace(
  'return { primary, secondary, glow, overlayGradient, isLight };',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };'
);

// 2. in computeOctTree:
code = code.replace(
  'return { primary, secondary, glow, overlayGradient, isLight };',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };'
);

// 3. in computeMedianCut:
code = code.replace(
  'return { primary, secondary, glow, overlayGradient, isLight };',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };'
);

// 4. in getDefaultPalette:
const oldDefault = `function getDefaultPalette(algorithm: PaletteAlgorithmOption): PaletteColors {`;
const newDefault = `function getDefaultPalette(algorithm: PaletteAlgorithmOption): PaletteColors {
  const pal = getDefaultPaletteRaw(algorithm);
  const rgb = pal.primary.startsWith("#") ? [
    parseInt(pal.primary.slice(1, 3), 16),
    parseInt(pal.primary.slice(3, 5), 16),
    parseInt(pal.primary.slice(5, 7), 16)
  ] : [225, 29, 72];
  return { ...pal, m3: generateM3TonalPalette(rgb[0], rgb[1], rgb[2], pal.isLight) };
}

function getDefaultPaletteRaw(algorithm: PaletteAlgorithmOption): PaletteColors {`;

code = code.replace(oldDefault, newDefault);

fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
console.log("paletteExtractor.ts patched with Material 3 Tonal Palette Engine!");
