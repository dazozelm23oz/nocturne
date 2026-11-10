const fs = require('fs');
let code = fs.readFileSync('pages/index.tsx', 'utf8');

code = code.replace(
  '  const currentTime = useTime();',
  '  const rawCurrentTime = useTime();\n  const syncOffsetSec = (settings.syncOffsetMs || 0) / 1000;\n  const currentTime = Math.max(0, rawCurrentTime + syncOffsetSec);'
);
code = code.replace(
  '  const currentTime = useTime();\r\n',
  '  const rawCurrentTime = useTime();\r\n  const syncOffsetSec = (settings.syncOffsetMs || 0) / 1000;\r\n  const currentTime = Math.max(0, rawCurrentTime + syncOffsetSec);\r\n'
);

fs.writeFileSync('pages/index.tsx', code, 'utf8');
console.log('pages/index.tsx updated with syncOffsetMs');
