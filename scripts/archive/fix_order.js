const fs = require('fs');

// 1. Fix AppleMusicSettingsModal.tsx line with icon="link" -> icon="thunderbolt"
let modal = fs.readFileSync('components/AppleMusicSettingsModal.tsx', 'utf8');
modal = modal.replace('<GruvboxIcon name="link" size={18} />', '<GruvboxIcon name="thunderbolt" size={18} />');
fs.writeFileSync('components/AppleMusicSettingsModal.tsx', modal, 'utf8');

// 2. Fix pages/index.tsx declaration order
let index = fs.readFileSync('pages/index.tsx', 'utf8');
// remove settings declaration from old spot
index = index.replace(
  '  // Apple Music Lyrics Settings State & Persistence\n  const [settings, setSettings] = useState<LyricsSettings>(DEFAULT_LYRICS_SETTINGS);',
  '  // Apple Music Lyrics Settings State & Persistence (moved up)'
);
index = index.replace(
  '  // Apple Music Lyrics Settings State & Persistence\r\n  const [settings, setSettings] = useState<LyricsSettings>(DEFAULT_LYRICS_SETTINGS);',
  '  // Apple Music Lyrics Settings State & Persistence (moved up)'
);

// place settings declaration above rawCurrentTime
index = index.replace(
  '  const rawCurrentTime = useTime();',
  '  const [settings, setSettings] = useState<LyricsSettings>(DEFAULT_LYRICS_SETTINGS);\n  const rawCurrentTime = useTime();'
);
index = index.replace(
  '  const rawCurrentTime = useTime();\r\n',
  '  const [settings, setSettings] = useState<LyricsSettings>(DEFAULT_LYRICS_SETTINGS);\r\n  const rawCurrentTime = useTime();\r\n'
);

fs.writeFileSync('pages/index.tsx', index, 'utf8');
console.log('Fixed icon and variable order');
