const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics';

// 1. Fix paletteExtractor.ts:
const palPath = path.join(baseDir, 'lib/paletteExtractor.ts');
let pal = fs.readFileSync(palPath, 'utf8');

pal = pal.replace(
  /case "Auto \(Beta\)":[\s\S]*?default:[\s\S]*?return \{[\s\S]*?primary: "#38bdf8",[\s\S]*?secondary: "#0f172a",[\s\S]*?tertiary: "#818cf8",[\s\S]*?quaternary: "#0284c7",[\s\S]*?paletteList: \["#38bdf8", "#0f172a", "#818cf8", "#0284c7"\],[\s\S]*?glow: "rgba\(56, 189, 248, 0\.35\)",[\s\S]*?overlayGradient:[\s\S]*?"radial-gradient\(circle at 35% 50%, rgba\(56, 189, 248, 0\.20\) 0%, rgba\(15, 23, 42, 0\.88\) 100%\)",[\s\S]*?isLight: false,[\s\S]*?\};/,
  `case "Auto (Beta)":
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
      };`
);

// Also update computeOctTree and computeMedianCut to populate tertiary, quaternary, paletteList:
pal = pal.replace(
  `  return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };\n}`,
  `  const tertiary = \`rgb(\${Math.round(r * 0.8 + 30)}, \${Math.round(g * 0.8 + 20)}, \${Math.round(b * 0.8 + 10)})\`;
  const quaternary = \`rgb(\${Math.round(r * 0.6 + 50)}, \${Math.round(g * 0.5 + 40)}, \${Math.round(b * 0.4 + 30)})\`;
  const paletteList = [primary, secondary, tertiary, quaternary];
  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };
}`
);

pal = pal.replace(
  `  return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };\n}`,
  `  const tertiary = \`rgb(\${Math.round(target[0] * 0.85)}, \${Math.round(target[1] * 0.7)}, \${Math.round(target[2] * 0.6)})\`;
  const quaternary = \`rgb(\${Math.round(target[0] * 0.5 + 40)}, \${Math.round(target[1] * 0.6 + 20)}, \${Math.round(target[2] * 0.5)})\`;
  const paletteList = [primary, secondary, tertiary, quaternary];
  return { primary, secondary, tertiary, quaternary, paletteList, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };
}`
);

fs.writeFileSync(palPath, pal, 'utf8');
console.log('paletteExtractor.ts updated successfully');
