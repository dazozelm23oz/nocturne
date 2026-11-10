const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'styles', 'SettingsModal.module.css');
let content = fs.readFileSync(cssPath, 'utf8');
content = content.replace(/\r\n/g, '\n');
fs.writeFileSync(cssPath, content, 'utf8');
console.log('Normalized line endings to LF');
