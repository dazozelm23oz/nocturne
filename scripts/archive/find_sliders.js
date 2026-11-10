const fs = require('fs');

function checkFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('type="range"') || l.includes('slider') || l.includes('Slider')) {
      console.log(`${file}:${i + 1}: ${l.trim()}`);
    }
  });
}

checkFile('components/AppleMusicSettingsModal.tsx');
checkFile('pages/index.tsx');
checkFile('styles/SettingsModal.module.css');
checkFile('styles/AppleMusic.module.css');
