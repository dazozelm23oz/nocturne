const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const seekTarget = 'seekTo(targetSeconds);';
const seekReplacement = `const seekStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    seekTo(targetSeconds);
    recordMetric("seek_action", (typeof performance !== "undefined" ? performance.now() : Date.now()) - seekStart);`;

const pbTarget = `  function playback(pause: boolean) {
    fetch("/api/spotify/playback", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pause ? { pause: true } : { play: true }),
    });
    refetchSong(true);
  }`;

const pbReplacement = `  function playback(pause: boolean) {
    const pbStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    fetch("/api/spotify/playback", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pause ? { pause: true } : { play: true }),
    }).finally(() => {
      const pbElapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - pbStart;
      recordMetric("playback_toggle", pbElapsed);
    });
    refetchSong(true);
  }`;

const nextTarget = 'await skipNext();';
const nextReplacement = `const skipStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    await skipNext();
    recordMetric("skip_speed", (typeof performance !== "undefined" ? performance.now() : Date.now()) - skipStart);`;

const prevTarget = 'await skipPrev(currentTime);';
const prevReplacement = `const prevStart = typeof performance !== "undefined" ? performance.now() : Date.now();
    await skipPrev(currentTime);
    recordMetric("skip_speed", (typeof performance !== "undefined" ? performance.now() : Date.now()) - prevStart);`;

// Normalize \r\n to \n for matching, then do replacement
const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

if (!normalized.includes(seekTarget)) {
  console.error("seekTarget not found");
} else {
  normalized = normalized.replace(seekTarget, seekReplacement);
}

if (!normalized.includes(pbTarget)) {
  console.error("pbTarget not found");
} else {
  normalized = normalized.replace(pbTarget, pbReplacement);
}

if (!normalized.includes(nextTarget)) {
  console.error("nextTarget not found");
} else {
  normalized = normalized.replace(nextTarget, nextReplacement);
}

if (!normalized.includes(prevTarget)) {
  console.error("prevTarget not found");
} else {
  normalized = normalized.replace(prevTarget, prevReplacement);
}

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, normalized, 'utf8');
console.log("Successfully instrumented pages/index.tsx");
