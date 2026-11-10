const fs = require('fs');

// 1. Update typings/LyricsSettings.ts
const tsPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/typings/LyricsSettings.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

if (!tsContent.includes('particleSparkleIntensity: number;')) {
  tsContent = tsContent.replace(
    'particleSparkle: boolean;\n',
    'particleSparkle: boolean;\n  particleSparkleIntensity: number; // 1 to 100 (%)\n'
  );
  if (!tsContent.includes('particleSparkleIntensity: number;')) {
    // CRLF fallback
    tsContent = tsContent.replace(
      'particleSparkle: boolean;\r\n',
      'particleSparkle: boolean;\r\n  particleSparkleIntensity: number; // 1 to 100 (%)\r\n'
    );
  }
}

if (!tsContent.includes('particleSparkleIntensity: 65,')) {
  tsContent = tsContent.replace(
    'particleSparkle: true,\n',
    'particleSparkle: true,\n  particleSparkleIntensity: 65,\n'
  );
  if (!tsContent.includes('particleSparkleIntensity: 65,')) {
    // CRLF fallback
    tsContent = tsContent.replace(
      'particleSparkle: true,\r\n',
      'particleSparkle: true,\r\n  particleSparkleIntensity: 65,\r\n'
    );
  }
}

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log('typings/LyricsSettings.ts updated successfully');
