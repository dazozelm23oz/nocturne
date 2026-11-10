const fs = require('fs');
let css = fs.readFileSync('styles/SettingsModal.module.css', 'utf8');
css = css.replace('-webkit-/* backdrop-filter optimized */', '');
fs.writeFileSync('styles/SettingsModal.module.css', css, 'utf8');
console.log('Fixed CSS syntax');
