const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/AppleMusic.module.css';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

const newStyles = `
/* ==========================================================================
   LYRIC MOVEMENT & TRANSITION STYLES (Apple TV & Cinematic Reference)
   ========================================================================== */

/* 1. Apple TV Kinetic Glide (User reference photo style) */
@keyframes kineticRise {
  0% {
    transform: translateY(14px) scale(0.96);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-3px) scale(1.055);
  }
  100% {
    transform: translateY(0px) scale(1.05);
    opacity: 1;
  }
}

@keyframes kineticFloatBreathe {
  0%, 100% {
    transform: translateY(0px) scale(1.05);
  }
  50% {
    transform: translateY(-4px) scale(1.055);
  }
}

.movementKinetic {
  animation: kineticRise 0.52s cubic-bezier(0.16, 1, 0.3, 1),
             kineticFloatBreathe 4.5s ease-in-out infinite 0.52s !important;
  will-change: transform, opacity;
}

/* 2. Cinematic Center Snap */
@keyframes cinematicSnapIn {
  0% {
    transform: scale(0.97) translateY(4px);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.045) translateY(0px);
    opacity: 1;
  }
}

.movementCinematic {
  animation: cinematicSnapIn 0.38s cubic-bezier(0.19, 1, 0.22, 1) forwards !important;
}

/* 3. Floating Wave Drift */
@keyframes waveDriftFloat {
  0% {
    transform: translate(0px, 0px) scale(1.04);
  }
  33% {
    transform: translate(-3px, -4px) scale(1.05);
  }
  66% {
    transform: translate(3px, -2px) scale(1.045);
  }
  100% {
    transform: translate(0px, 0px) scale(1.04);
  }
}

.movementWaveDrift {
  animation: waveDriftFloat 5.2s ease-in-out infinite !important;
  will-change: transform;
}

/* 4. Elastic Spring Pop (iOS 26 Style) */
@keyframes elasticSpringPopIn {
  0% {
    transform: scale(0.92);
  }
  45% {
    transform: scale(1.085);
  }
  75% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1.05);
  }
}

.movementElasticPop {
  animation: elasticSpringPopIn 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             lyricFloatMed 4s ease-in-out infinite 0.48s !important;
  will-change: transform;
}

/* 5. Smooth Fade & Glide */
@keyframes smoothGlideIn {
  0% {
    transform: translateY(8px);
    opacity: 0.65;
  }
  100% {
    transform: translateY(0px) scale(1.035);
    opacity: 1;
  }
}

.movementSmoothGlide {
  animation: smoothGlideIn 0.62s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
  will-change: transform, opacity;
}

/* 6. Subtle Classic */
.movementClassic {
  transform: scale(1.025) !important;
  transition: transform 0.25s ease, color 0.25s ease !important;
}

/* ==========================================================================
   RAINBOW SPECTRUM & CHROMATIC ANIMATION
   ========================================================================== */
@keyframes rainbowFlowShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.rainbowLyricLine.active {
  background: linear-gradient(
    90deg,
    #ff2a5f 0%,
    #ff7e40 16%,
    #ffc83b 32%,
    #10b981 48%,
    #06b6d4 64%,
    #6366f1 80%,
    #ec4899 92%,
    #ff2a5f 100%
  ) !important;
  background-size: 250% 100% !important;
  animation: rainbowFlowShift 4s linear infinite !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
  filter: drop-shadow(0 0 18px rgba(255, 42, 95, 0.45))
          drop-shadow(0 0 32px rgba(6, 182, 212, 0.35)) !important;
}

.rainbowLyricLine.active .karaokeWord.wordCompleted {
  background: linear-gradient(
    90deg,
    #ff2a5f 0%,
    #ff7e40 16%,
    #ffc83b 32%,
    #10b981 48%,
    #06b6d4 64%,
    #6366f1 80%,
    #ec4899 92%,
    #ff2a5f 100%
  ) !important;
  background-size: 250% 100% !important;
  animation: rainbowFlowShift 4s linear infinite !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

.rainbowLyricLine.active .karaokeWord.wordActive {
  background: linear-gradient(
    to right,
    #ff2a5f 0%,
    #ffc83b calc(var(--word-pct, 0%) * 0.5),
    #06b6d4 var(--word-pct, 0%),
    rgba(255, 255, 255, 0.95) calc(var(--word-pct, 0%) + 1%),
    rgba(255, 255, 255, 0.38) calc(var(--word-pct, 0%) + 6%),
    rgba(255, 255, 255, 0.38) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}
`;

c += newStyles;

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Appended movement and rainbow styles to AppleMusic.module.css!');
