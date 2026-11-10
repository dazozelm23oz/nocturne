const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/lib/paletteExtractor.ts';
let code = fs.readFileSync(file, 'utf8');

const m3Def = `export interface M3TonalPalette {
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
}`;

code = code.replace(/export interface PaletteColors \{[\s\S]*?m3\?: \{[\s\S]*?\};[\s\S]*?\}/, m3Def + '\n\nexport interface PaletteColors {\n  primary: string;\n  secondary: string;\n  tertiary?: string;\n  quaternary?: string;\n  paletteList?: string[];\n  glow: string;\n  overlayGradient: string;\n  isLight: boolean;\n  m3?: M3TonalPalette;\n}');

const genM3 = `function generateM3TonalPalette(r: number, g: number, b: number, isLightMode: boolean): M3TonalPalette {
  const primaryRgb = \`\${r}, \${g}, \${b}\`;
  const primary = rgbToHex(r, g, b);
  const glow = \`rgba(\${r}, \${g}, \${b}, 0.45)\`;

  if (isLightMode) {
    return {
      surface: '#f5f5f8',
      surfaceRgb: '245, 245, 248',
      surfaceContainer: '#ebebf0',
      surfaceContainerRgb: '235, 235, 240',
      primary,
      primaryRgb,
      onPrimary: '#ffffff',
      onSurface: '#09090b',
      onSurfaceRgb: '9, 9, 11',
      onSurfaceVariant: '#27272a',
      outline: '#71717a',
      outlineRgb: '113, 113, 122',
      glow,
    };
  } else {
    return {
      surface: '#121216',
      surfaceRgb: '18, 18, 22',
      surfaceContainer: '#1a1a20',
      surfaceContainerRgb: '26, 26, 32',
      primary,
      primaryRgb,
      onPrimary: '#09090b',
      onSurface: '#ffffff',
      onSurfaceRgb: '255, 255, 255',
      onSurfaceVariant: 'rgba(255, 255, 255, 0.72)',
      outline: '#3f3f46',
      outlineRgb: '63, 63, 70',
      glow,
    };
  }
}`;

code = code.replace(/function generateM3TonalPalette\(r: number, g: number, b: number, isLightMode: boolean\) \{[\s\S]*?\n\}/, genM3);

fs.writeFileSync(file, code, 'utf8');
console.log('M3 interface and generateM3TonalPalette updated in paletteExtractor.ts');
