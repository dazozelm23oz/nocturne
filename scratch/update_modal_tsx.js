const fs = require('fs');
const filePath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

// 1. Add useMemo and tokenizeLyric
const oldImport = `import React, { useState, useEffect, useRef, useCallback } from "react";`;
const newImport = `import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { tokenizeLyric } from "@/lib/lyricTokenizer";`;

if (!content.includes(oldImport)) {
  console.error('Could not find oldImport in AppleMusicSettingsModal.tsx!');
  process.exit(1);
}
content = content.replace(oldImport, newImport);

// 2. Add activeTokens in StudioLivePreview
const studioSearch = `  const [previewSweepProgress, setPreviewSweepProgress] = useState<number>(45);`;
const studioReplace = `  const [previewSweepProgress, setPreviewSweepProgress] = useState<number>(45);
  const activeTokens = useMemo(() => tokenizeLyric(lineActive), [lineActive]);`;

if (!content.includes(studioSearch)) {
  console.error('Could not find studioSearch!');
  process.exit(1);
}
content = content.replace(studioSearch, studioReplace);

// 3. Replace Active Singing Line in StudioLivePreview
const oldPBlock = `            {/* Active Singing Line */}
            <p
              className={\`\${styles.previewActiveLine} \${
                settings.wordShine ? styles.previewWordShine : ""
              } \${
                settings.particleSparkle ? styles.particleSparkleActive : ""
              }\`}
              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: settings.dynamicLineScaling ? "1.45rem" : previewActiveSize,
                transform: \`scale(\${previewScale})\`,
                background: previewDynamicSweepBg,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow:
                  !isLightMode && previewPalette?.glow
                    ? \`0 0 16px \${previewPalette.glow}\`
                    : undefined,
                position: "relative",
                ...previewFloatStyle,
              }}
            >
              {settings.karaokeBouncingBall && isSimulatingSweep && (
                <span
                  className={styles.karaokeBouncingDot}
                  style={{
                    left: \`\${previewSweepProgress}%\`,
                    top: "-8px",
                  }}
                />
              )}
              {settings.vocalistBadges && settings.duetView && (
                <span
                  className={styles.duetBadgeLead}
                  style={{ fontSize: "9px", padding: "1px 6px", marginRight: "6px" }}
                >
                  Singer 1
                </span>
              )}
              {lineActive}
            </p>`;

const newPBlock = `            {/* Active Singing Line (Sequential Multi-Line Sweep) */}
            <p
              className={\`\${styles.previewActiveLine} \${
                settings.wordShine ? styles.previewWordShine : ""
              } \${
                settings.particleSparkle ? styles.particleSparkleActive : ""
              }\`}
              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: settings.dynamicLineScaling ? "1.45rem" : previewActiveSize,
                transform: \`scale(\${previewScale})\`,
                color: previewLyricActiveColor,
                textShadow:
                  !isLightMode && previewPalette?.glow
                    ? \`0 0 16px \${previewPalette.glow}\`
                    : undefined,
                position: "relative",
                ...previewFloatStyle,
              }}
            >
              {settings.vocalistBadges && settings.duetView && (
                <span
                  className={styles.duetBadgeLead}
                  style={{ fontSize: "9px", padding: "1px 6px", marginRight: "6px" }}
                >
                  Singer 1
                </span>
              )}
              {activeTokens.tokens.length === 0 ? (
                lineActive
              ) : (
                activeTokens.tokens.map((token, tIdx) => {
                  if (token.isNewline) return <br key={tIdx} />;
                  if (token.isSpace) {
                    return (
                      <span key={tIdx} className={styles.previewSpace}>
                        {token.text}
                      </span>
                    );
                  }
                  if (token.text === "(" || token.text === ")") {
                    return (
                      <span key={tIdx} className={styles.previewParen}>
                        {token.text}
                      </span>
                    );
                  }

                  const P = previewSweepProgress / 100;
                  let wordStyle: React.CSSProperties = {};
                  let showBouncingDotHere = false;

                  if (P >= token.endFrac) {
                    wordStyle = {
                      color: previewLyricActiveColor,
                      background: "none",
                      WebkitTextFillColor: "initial",
                    };
                  } else if (P <= token.startFrac) {
                    wordStyle = {
                      color: previewInactiveColor,
                      background: "none",
                      WebkitTextFillColor: "initial",
                    };
                  } else {
                    const denom = Math.max(0.001, token.endFrac - token.startFrac);
                    const localPct = Math.min(100, Math.max(0, ((P - token.startFrac) / denom) * 100));
                    wordStyle = {
                      background: isLightMode
                        ? \`linear-gradient(to right, \${previewLyricActiveColor} 0%, \${previewLyricActiveColor} \${localPct}%, rgba(20, 20, 24, 0.35) \${localPct + 1}%, rgba(20, 20, 24, 0.35) 100%)\`
                        : \`linear-gradient(to right, \${previewLyricActiveColor} 0%, \${previewLyricActiveColor} \${localPct}%, rgba(255, 255, 255, 0.38) \${localPct + 1}%, rgba(255, 255, 255, 0.38) 100%)\`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    };
                    showBouncingDotHere = true;
                  }

                  return (
                    <span
                      key={tIdx}
                      className={styles.previewWord}
                      style={wordStyle}
                    >
                      {settings.karaokeBouncingBall && isSimulatingSweep && showBouncingDotHere && (
                        <span
                          className={styles.modalBouncingDot}
                          style={{
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: previewPalette?.primary || "#ffffff",
                          }}
                        />
                      )}
                      {token.text}
                    </span>
                  );
                })
              )}
            </p>`;

if (!content.includes(oldPBlock)) {
  console.error('Could not find oldPBlock in AppleMusicSettingsModal.tsx!');
  process.exit(1);
}
content = content.replace(oldPBlock, newPBlock);

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated AppleMusicSettingsModal.tsx!');
