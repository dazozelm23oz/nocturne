const fs = require('fs');
let code = fs.readFileSync('typings/LyricsSettings.ts', 'utf8');

code = code.replace(
  'showLivePreview: boolean;\n}',
  'showLivePreview: boolean;\n  syncOffsetMs: number;\n}'
);
code = code.replace(
  'showLivePreview: boolean;\r\n}',
  'showLivePreview: boolean;\r\n  syncOffsetMs: number;\r\n}'
);

code = code.replace(
  'showLivePreview: true,\n};',
  'showLivePreview: true,\n  syncOffsetMs: 0,\n};'
);
code = code.replace(
  'showLivePreview: true,\r\n};',
  'showLivePreview: true,\r\n  syncOffsetMs: 0,\r\n};'
);

fs.writeFileSync('typings/LyricsSettings.ts', code, 'utf8');
console.log('typings/LyricsSettings.ts updated');
