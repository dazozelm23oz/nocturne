const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'styles', 'AppleMusic.module.css');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. .lyricsScroller padding
const scrollerTarget = `padding: 38vh 6vw 42vh 2vw;`;
const scrollerReplacement = `padding: 38vh 6vw 42vh max(4.5vw, 68px);`;

if (!normalized.includes(scrollerTarget)) {
  console.error("scrollerTarget not found");
  process.exit(1);
}
normalized = normalized.replace(scrollerTarget, scrollerReplacement);

// 2. .lyricLine padding and margin for safe glow bleed
const lyricLineTarget = `.lyricLine {
  font-size: calc(var(--lyric-size, 38px) * var(--zoom-scale, 1));
  font-weight: var(--lyrics-weight, 700);
  line-height: var(--lyric-lh, 1.34);
  font-family: var(--lyrics-font, inherit);
  letter-spacing: -0.02em;
  margin: 0;
  cursor: pointer;
  transform-origin: left center;
  user-select: none;
  max-width: 780px;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              opacity 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              filter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}`;

const lyricLineReplacement = `.lyricLine {
  font-size: calc(var(--lyric-size, 38px) * var(--zoom-scale, 1));
  font-weight: var(--lyrics-weight, 700);
  line-height: var(--lyric-lh, 1.34);
  font-family: var(--lyrics-font, inherit);
  letter-spacing: -0.02em;
  margin: 0;
  padding: 4px 18px 4px 18px;
  margin-left: -18px;
  box-sizing: border-box;
  border-radius: 12px;
  cursor: pointer;
  transform-origin: left center;
  user-select: none;
  max-width: 816px;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              opacity 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
              filter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}`;

if (!normalized.includes(lyricLineTarget)) {
  console.error("lyricLineTarget not found");
  process.exit(1);
}
normalized = normalized.replace(lyricLineTarget, lyricLineReplacement);

// 3. .wordShining multi-tier Gaussian falloff
const shineTarget = `.wordShining {
  filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 32px rgba(255, 255, 255, 0.25)) !important;
}`;

const shineReplacement = `.wordShining {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.55))
          drop-shadow(0 0 20px rgba(255, 255, 255, 0.35))
          drop-shadow(0 0 38px rgba(255, 255, 255, 0.15)) !important;
}`;

if (!normalized.includes(shineTarget)) {
  console.error("shineTarget not found");
  process.exit(1);
}
normalized = normalized.replace(shineTarget, shineReplacement);

// 4. .lyricLine.active glow
const activeLineTarget = `.lyricLine.active {
  filter: blur(0px) drop-shadow(0 0 20px var(--ambient-glow, rgba(255, 255, 255, 0.18)));
  transform: scale(var(--active-scale, 1.03));
  color: var(--active-lyric-color, #ffffff);
  -webkit-text-fill-color: currentColor;
  position: relative;
}`;

const activeLineReplacement = `.lyricLine.active {
  filter: blur(0px) drop-shadow(0 0 16px var(--ambient-glow, rgba(255, 255, 255, 0.22)))
                    drop-shadow(0 0 32px var(--ambient-glow, rgba(255, 255, 255, 0.12)));
  transform: scale(var(--active-scale, 1.03));
  color: var(--active-lyric-color, #ffffff);
  -webkit-text-fill-color: currentColor;
  position: relative;
}`;

if (!normalized.includes(activeLineTarget)) {
  console.error("activeLineTarget not found");
  process.exit(1);
}
normalized = normalized.replace(activeLineTarget, activeLineReplacement);

// 5. Fallback plain text sweep feathered edge
const plainSweepTarget = `/* Fallback plain text sweep */
.lyricLine.active.plainTextSweep {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #ffffff) 0%,
    var(--active-lyric-color, #ffffff) var(--karaoke-pct, 0%),
    rgba(255, 255, 255, 0.38) var(--karaoke-pct, 0%),
    rgba(255, 255, 255, 0.38) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}`;

const plainSweepReplacement = `/* Fallback plain text sweep with feathered leading edge */
.lyricLine.active.plainTextSweep {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #ffffff) 0%,
    var(--active-lyric-color, #ffffff) calc(var(--karaoke-pct, 0%) - 2%),
    rgba(255, 255, 255, 0.9) var(--karaoke-pct, 0%),
    rgba(255, 255, 255, 0.38) calc(var(--karaoke-pct, 0%) + 6%),
    rgba(255, 255, 255, 0.38) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}`;

if (!normalized.includes(plainSweepTarget)) {
  console.error("plainSweepTarget not found");
  process.exit(1);
}
normalized = normalized.replace(plainSweepTarget, plainSweepReplacement);

// 6. Word sweep feathered leading edge
const wordSweepTarget = `/* Active line: currently sweeping word */
.lyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #ffffff) 0%,
    var(--active-lyric-color, #ffffff) var(--word-pct, 0%),
    rgba(255, 255, 255, 0.38) calc(var(--word-pct, 0%) + 0.5%),
    rgba(255, 255, 255, 0.38) 100%
  );
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}`;

const wordSweepReplacement = `/* Active line: currently sweeping word with feathered leading and trailing blend */
.lyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #ffffff) 0%,
    var(--active-lyric-color, #ffffff) calc(var(--word-pct, 0%) - 2%),
    rgba(255, 255, 255, 0.92) var(--word-pct, 0%),
    rgba(255, 255, 255, 0.38) calc(var(--word-pct, 0%) + 6%),
    rgba(255, 255, 255, 0.38) 100%
  );
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}`;

if (!normalized.includes(wordSweepTarget)) {
  console.error("wordSweepTarget not found");
  process.exit(1);
}
normalized = normalized.replace(wordSweepTarget, wordSweepReplacement);

// 7. Responsive adjustments
const responsiveTarget = `  .lyricsScroller {
    padding: 20px 20px 100px 20px;
    height: auto;
    max-height: 60vh;
  }`;

const responsiveReplacement = `  .lyricsScroller {
    padding: 20px 20px 100px max(4vw, 36px);
    height: auto;
    max-height: 60vh;
  }`;

if (!normalized.includes(responsiveTarget)) {
  console.error("responsiveTarget not found");
  process.exit(1);
}
normalized = normalized.replace(responsiveTarget, responsiveReplacement);

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, normalized, 'utf8');
console.log("Successfully patched styles/AppleMusic.module.css with feathered glow blending!");
