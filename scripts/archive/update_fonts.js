const fs = require('fs');

// 1. Update AppleMusic.module.css
let appleCss = fs.readFileSync('styles/AppleMusic.module.css', 'utf8');
appleCss = appleCss.replace(
  'font-family: var(--lyrics-font, inherit);',
  'font-family: var(--lyrics-font, inherit) !important;'
);
appleCss = appleCss.replace(
  '.karaokeWord {\n  display: inline-block;',
  '.karaokeWord {\n  display: inline-block;\n  font-family: inherit !important;'
);
appleCss = appleCss.replace(
  '.karaokeWord {\r\n  display: inline-block;',
  '.karaokeWord {\r\n  display: inline-block;\r\n  font-family: inherit !important;'
);
fs.writeFileSync('styles/AppleMusic.module.css', appleCss, 'utf8');

// 2. Update pages/index.tsx fontStack
let indexTsx = fs.readFileSync('pages/index.tsx', 'utf8');
const oldFontBlock = `  let fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    fontStack = '"New York", "Playfair Display", "Cormorant Garamond", "Georgia", serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    fontStack = '"CircularStd", "Circular", -apple-system, "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    fontStack = '"SpotifyMix", -apple-system, "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    fontStack = '"SF Pro Rounded", "Arial Rounded MT Bold", "Nunito", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    fontStack = 'Consolas, Monaco, "Courier New", monospace';
  }`;

const newFontBlock = `  let fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    fontStack = '"Playfair Display", "Newsreader", "New York", Georgia, serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    fontStack = '"Plus Jakarta Sans", "CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    fontStack = '"Montserrat", "SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    fontStack = '"Nunito", "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    fontStack = '"JetBrains Mono", Consolas, Monaco, monospace';
  }`;

indexTsx = indexTsx.replace(oldFontBlock, newFontBlock);
// Also support \r\n
indexTsx = indexTsx.replace(oldFontBlock.replace(/\n/g, '\r\n'), newFontBlock.replace(/\n/g, '\r\n'));
fs.writeFileSync('pages/index.tsx', indexTsx, 'utf8');

console.log('Fonts updated successfully');
