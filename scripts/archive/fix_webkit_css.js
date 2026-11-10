const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

c = c.replace('  /* removed nested blur */\n  -webkit-/* removed nested blur */\n', '');
c = c.replace('  /* removed redundant inner blur */\n  -webkit-/* removed redundant inner blur */\n', '');

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully cleaned invalid -webkit- tokens from SettingsModal.module.css!');
