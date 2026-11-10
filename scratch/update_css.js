const fs = require('fs');
const filePath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `/* Active Lyric Line with Karaoke Progressive Highlight */
.lyricLine.active {
  filter: blur(0px) drop-shadow(0 0 20px var(--ambient-glow, rgba(255, 255, 255, 0.18)));
  transform: scale(var(--active-scale, 1.03));
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

const replacement1 = `/* Active Lyric Line */
.lyricLine.active {
  filter: blur(0px) drop-shadow(0 0 20px var(--ambient-glow, rgba(255, 255, 255, 0.18)));
  transform: scale(var(--active-scale, 1.03));
  color: var(--active-lyric-color, #ffffff);
  -webkit-text-fill-color: currentColor;
  position: relative;
}

/* Fallback plain text sweep */
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
}

/* ==========================================================================
   Sequential Word Karaoke Tokens (Multi-line and single-line sequential sweep)
   ========================================================================== */
.karaokeWord {
  display: inline-block;
  position: relative;
  transition: color 0.12s ease;
  vertical-align: baseline;
  white-space: pre;
}

.karaokeSpace {
  display: inline;
  white-space: pre;
}

.backingParen {
  opacity: 0.65;
  display: inline-block;
  vertical-align: baseline;
}

.backingWord {
  opacity: 0.72;
}

/* Inactive lyric lines: words are dimmed */
.lyricLine.inactive .karaokeWord {
  color: rgba(255, 255, 255, 0.38);
  -webkit-text-fill-color: rgba(255, 255, 255, 0.38);
  background: none !important;
}

.lyricLine.inactive:hover .karaokeWord {
  color: rgba(255, 255, 255, 0.75);
  -webkit-text-fill-color: rgba(255, 255, 255, 0.75);
}

/* Active line: unplayed words waiting for their turn */
.lyricLine.active .karaokeWord.wordUnplayed {
  color: rgba(255, 255, 255, 0.38);
  -webkit-text-fill-color: rgba(255, 255, 255, 0.38);
  background: none !important;
}

/* Active line: currently sweeping word */
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
}

/* Active line: completed sung words */
.lyricLine.active .karaokeWord.wordCompleted {
  color: var(--active-lyric-color, #ffffff);
  -webkit-text-fill-color: var(--active-lyric-color, #ffffff);
  background: none !important;
}`;

// Light mode overrides
const target2 = `.themeLight .lyricLine.active {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #111113) 0%,
    var(--active-lyric-color, #111113) var(--karaoke-pct, 0%),
    rgba(20, 20, 24, 0.35) var(--karaoke-pct, 0%),
    rgba(20, 20, 24, 0.35) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: blur(0px) drop-shadow(0 0 18px rgba(0, 0, 0, 0.08)) !important;
}`;

const replacement2 = `.themeLight .lyricLine.active {
  color: var(--active-lyric-color, #111113) !important;
  -webkit-text-fill-color: currentColor !important;
  filter: blur(0px) drop-shadow(0 0 18px rgba(0, 0, 0, 0.08)) !important;
  background: none !important;
}

.themeLight .lyricLine.active.plainTextSweep {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #111113) 0%,
    var(--active-lyric-color, #111113) var(--karaoke-pct, 0%),
    rgba(20, 20, 24, 0.35) var(--karaoke-pct, 0%),
    rgba(20, 20, 24, 0.35) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

.themeLight .lyricLine.inactive .karaokeWord {
  color: rgba(20, 20, 24, 0.35) !important;
  -webkit-text-fill-color: rgba(20, 20, 24, 0.35) !important;
  background: none !important;
}

.themeLight .lyricLine.inactive:hover .karaokeWord {
  color: rgba(20, 20, 24, 0.75) !important;
  -webkit-text-fill-color: rgba(20, 20, 24, 0.75) !important;
}

.themeLight .lyricLine.active .karaokeWord.wordUnplayed {
  color: rgba(20, 20, 24, 0.35) !important;
  -webkit-text-fill-color: rgba(20, 20, 24, 0.35) !important;
  background: none !important;
}

.themeLight .lyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    var(--active-lyric-color, #111113) 0%,
    var(--active-lyric-color, #111113) var(--word-pct, 0%),
    rgba(20, 20, 24, 0.35) calc(var(--word-pct, 0%) + 0.5%),
    rgba(20, 20, 24, 0.35) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}

.themeLight .lyricLine.active .karaokeWord.wordCompleted {
  color: var(--active-lyric-color, #111113) !important;
  -webkit-text-fill-color: var(--active-lyric-color, #111113) !important;
  background: none !important;
}`;

// Bouncing dot
const target3 = `.karaokeBouncingDot {
  position: absolute;
  top: -10px;
  left: var(--karaoke-pct, 0%);
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-color, #ffffff);
  box-shadow: 0 0 10px var(--accent-color, #ffffff), 0 0 18px var(--ambient-glow, rgba(255, 255, 255, 0.8));
  transform: translateX(-50%);
  transition: left 0.08s linear;
  animation: karaokeBounceHop 0.55s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 10;
}`;

const replacement3 = `.karaokeBouncingDot {
  position: absolute;
  top: 0;
  left: 0;
  width: 14px;
  height: 14px;
  pointer-events: none;
  z-index: 10;
  will-change: transform;
  display: flex;
  align-items: center;
  justify-content: center;
}

.karaokeBouncingDotInner {
  width: 8.5px;
  height: 8.5px;
  border-radius: 50%;
  background: var(--accent-color, #ffffff);
  box-shadow: 0 0 10px var(--accent-color, #ffffff), 0 0 18px var(--ambient-glow, rgba(255, 255, 255, 0.8));
  animation: karaokeBounceHop 0.52s ease-in-out infinite alternate;
}`;

const target3b = `@keyframes karaokeBounceHop {
  0% {
    transform: translateX(-50%) translateY(0);
  }
  100% {
    transform: translateX(-50%) translateY(-6px);
  }
}`;

const replacement3b = `@keyframes karaokeBounceHop {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-7px);
  }
}`;

const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

if (!content.includes(norm(target1))) {
  console.error('Target 1 not found!');
  process.exit(1);
}
content = content.replace(norm(target1), norm(replacement1));

if (!content.includes(norm(target2))) {
  console.error('Target 2 not found!');
  process.exit(1);
}
content = content.replace(norm(target2), norm(replacement2));

if (!content.includes(norm(target3))) {
  console.error('Target 3 not found!');
  process.exit(1);
}
content = content.replace(norm(target3), norm(replacement3));

if (!content.includes(norm(target3b))) {
  console.error('Target 3b not found!');
  process.exit(1);
}
content = content.replace(norm(target3b), norm(replacement3b));

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated AppleMusic.module.css!');
