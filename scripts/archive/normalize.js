const fs = require('fs');
const files = [
  'components/AppleMusicSettingsModal.tsx',
  'styles/SettingsModal.module.css',
  'pages/index.tsx'
];
for (const f of files) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Normalized ${f}`);
  }
}
