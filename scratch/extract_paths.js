const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\Ziad\\.gemini\\antigravity\\scratch\\lirics\\public\\icons\\gruvbox';
const files = fs.readdirSync(dir);
const iconMap = {};

files.forEach(f => {
  if (f.endsWith('.svg')) {
    const name = f.replace('.svg', '');
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const match = content.match(/<path[^>]*d="([^"]+)"/);
    if (match) {
      iconMap[name] = match[1];
    } else {
      console.log('No path match for', f);
    }
  }
});

console.log('Total extracted icons:', Object.keys(iconMap).length);
const outDir = 'C:\\Users\\Ziad\\.gemini\\antigravity\\scratch\\lirics\\components\\icons';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, 'gruvboxPaths.json'), JSON.stringify(iconMap, null, 2));
console.log('Saved to components/icons/gruvboxPaths.json');
