const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. AuroraMeshOrbs & AmbientStardust in background
const t1 = `            {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
              <AuroraMeshOrbs
                palette={paletteColors}
                isPlaying={data?.is_playing || false}
                isLightMode={isLightMode}
              />
            )}
            {settings.ambientStardust && (
              <AmbientStardust
                isPlaying={data?.is_playing || false}
                primaryColor={paletteColors?.primary}
                isLightMode={isLightMode}
              />
            )}`;

const r1 = `            {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
              <AuroraMeshOrbs
                palette={paletteColors}
                isPlaying={!showSettingsModal && (data?.is_playing || false)}
                isLightMode={isLightMode}
              />
            )}
            {settings.ambientStardust && (
              <AmbientStardust
                isPlaying={!showSettingsModal && (data?.is_playing || false)}
                primaryColor={paletteColors?.primary}
                isLightMode={isLightMode}
              />
            )}`;

if (!normalized.includes(t1)) {
  console.error("t1 not found");
  process.exit(1);
}
normalized = normalized.replace(t1, r1);

// 2. VinylTurntable
const t2 = `                  {settings.vinylMode ? (
                    <VinylTurntable
                      songImage={song.image}
                      isPlaying={data?.is_playing || false}`;

const r2 = `                  {settings.vinylMode ? (
                    <VinylTurntable
                      songImage={song.image}
                      isPlaying={!showSettingsModal && (data?.is_playing || false)}`;

if (!normalized.includes(t2)) {
  console.error("t2 not found");
  process.exit(1);
}
normalized = normalized.replace(t2, r2);

// 3. AudioSpectrumVisualizer
const t3 = `                {settings.spectrumVisualizer && (
                  <AudioSpectrumVisualizer
                    isPlaying={data?.is_playing || false}`;

const r3 = `                {settings.spectrumVisualizer && (
                  <AudioSpectrumVisualizer
                    isPlaying={!showSettingsModal && (data?.is_playing || false)}`;

if (!normalized.includes(t3)) {
  console.error("t3 not found");
  process.exit(1);
}
normalized = normalized.replace(t3, r3);

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, normalized, 'utf8');
console.log("Successfully patched pages/index.tsx background freezing on settings open!");
