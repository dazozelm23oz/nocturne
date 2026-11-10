const fs = require('fs');

// 1. Fix AppleMusicSettingsModal.tsx
{
  const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
  let c = fs.readFileSync(file, 'utf8');
  const isCrlf = c.includes('\r\n');
  c = c.replace(/\r\n/g, '\n');

  c = c.replace(
    'const songKey = song.uri || (song.name && song.artists ? `${song.name}-${song.artists}` : "");',
    'const songKey = song.name && song.artists ? `${song.name}-${song.artists}` : (song.name || "");'
  );

  if (isCrlf) c = c.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Fixed AppleMusicSettingsModal.tsx songKey');
}

// 2. Fix pages/index.tsx
{
  const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/pages/index.tsx';
  let c = fs.readFileSync(file, 'utf8');
  const isCrlf = c.includes('\r\n');
  c = c.replace(/\r\n/g, '\n');

  c = c.replace(
    'const songKey = song?.uri || (song?.name && song?.artists ? `${song.name}-${song.artists}` : "");',
    'const songKey = song?.uri || (song?.name && song?.artist ? `${song.name}-${song.artist}` : "");'
  );

  if (isCrlf) c = c.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Fixed pages/index.tsx songKey');
}
