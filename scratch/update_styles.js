const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let css = fs.readFileSync(path, 'utf8');

// 1. Add nowPlayingKicker after .titleArtistCol
if (!css.includes('.nowPlayingKicker')) {
  css = css.replace(
    /\.titleArtistCol\s*\{[\s\S]*?max-width:\s*280px;\s*\}/,
    (match) => `${match}\n\n.nowPlayingKicker {\n  font-size: 11px;\n  font-weight: 750;\n  letter-spacing: 0.14em;\n  text-transform: uppercase;\n  color: var(--palette-primary, #e2e8f0);\n  opacity: 0.88;\n  margin-bottom: 5px;\n  user-select: none;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}`
  );
}

// 2. Add collapsibleControls and controlsHidden
if (!css.includes('.collapsibleControls')) {
  css = css.replace(
    /\.controlsRow\s*\{/,
    `.collapsibleControls {\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n  will-change: opacity, transform;\n}\n\n.controlsHidden {\n  opacity: 0 !important;\n  pointer-events: none !important;\n  transform: translateY(12px) scale(0.98);\n}\n\n.controlsRow {`
  );
}

// 3. Refine inactive words contrast matching TV photo
css = css.replace(
  /\.lyricLine\.inactive \.karaokeWord\s*\{\s*color:\s*rgba\(255,\s*255,\s*255,\s*0\.38\);\s*-webkit-text-fill-color:\s*rgba\(255,\s*255,\s*255,\s*0\.38\);/g,
  `.lyricLine.inactive .karaokeWord {\n  color: rgba(255, 255, 255, 0.25);\n  -webkit-text-fill-color: rgba(255, 255, 255, 0.25);`
);

fs.writeFileSync(path, css, 'utf8');
console.log('Successfully updated AppleMusic.module.css');
