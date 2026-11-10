const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/lib/paletteExtractor.ts';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

c = c.replace(
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };\n}',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(bestR, bestG, bestB, isLight) };\n}'
);

c = c.replace(
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };\n}\n\nfunction computeOctTree',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(chosen[0], chosen[1], chosen[2], isLight) };\n}\n\nfunction computeOctTree'
);

c = c.replace(
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };\n}\n\nfunction computeMedianCut',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(r, g, b, isLight) };\n}\n\nfunction computeMedianCut'
);

c = c.replace(
  'return { primary, secondary, glow, overlayGradient, isLight };\n}\n\nfunction getDefaultPalette',
  'return { primary, secondary, glow, overlayGradient, isLight, m3: generateM3TonalPalette(target[0], target[1], target[2], isLight) };\n}\n\nfunction getDefaultPalette'
);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Fixed paletteExtractor.ts M3 parameters!');
