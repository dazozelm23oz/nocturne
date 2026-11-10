const fs = require('fs');
const filePath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Ensure LyricToken is imported
if (!content.includes('LyricToken')) {
  content = content.replace('import { tokenizeLyric } from "@/lib/lyricTokenizer";', 'import { tokenizeLyric, LyricToken } from "@/lib/lyricTokenizer";');
}

const oldBlock = `              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: previewActiveSize,
                color: previewLyricActiveColor,
                transform: \`scale(\${previewScale})\`,
                transformOrigin: settings.rightAlignFirst ? "right center" : "center center",
                ...(settings.floatAnimation !== "None" ? previewFloatStyle : {}),
              }}
            >
              {settings.karaokeAnimation ? (
                activeTokens.map((token, idx) => {
                  const isPast = previewSweepProgress >= token.endPct;
                  const isCurrent = previewSweepProgress >= token.startPct && previewSweepProgress < token.endPct;
                  const localPct = isCurrent
                    ? ((previewSweepProgress - token.startPct) / (token.endPct - token.startPct)) * 100
                    : isPast ? 100 : 0;

                  return (
                    <span
                      key={idx}
                      className={styles.previewWordToken}
                      style={{
                        display: "inline-block",
                        marginRight: "0.28em",
                        background: isCurrent
                          ? \`linear-gradient(to right, \${previewLyricActiveColor} \${localPct}%, \${previewInactiveColor} \${localPct}%)\`
                          : undefined,
                        WebkitBackgroundClip: isCurrent ? "text" : undefined,
                        WebkitTextFillColor: isCurrent ? "transparent" : undefined,
                        color: isPast ? previewLyricActiveColor : !isCurrent ? previewInactiveColor : undefined,
                        textShadow: isPast || isCurrent ? \`0 0 20px \${previewPalette?.glow || "rgba(255,255,255,0.4)"}\` : "none",
                      }}
                    >
                      {token.text}
                    </span>
                  );
                })
              ) : (`;

const newBlock = `              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: previewActiveSize,
                color: previewLyricActiveColor,
                transform: \`scale(\${previewScale})\`,
                transformOrigin: settings.rightAlignFirst ? "right center" : "center center",
                ...(settings.floatAnimation !== "Off" ? previewFloatStyle : {}),
              }}
            >
              {settings.karaokeMode ? (
                activeTokens.tokens.map((token: LyricToken, idx: number) => {
                  const startPct = token.startFrac * 100;
                  const endPct = token.endFrac * 100;
                  const isPast = previewSweepProgress >= endPct;
                  const isCurrent = previewSweepProgress >= startPct && previewSweepProgress < endPct;
                  const localPct = isCurrent
                    ? ((previewSweepProgress - startPct) / Math.max(0.001, endPct - startPct)) * 100
                    : isPast ? 100 : 0;

                  return (
                    <span
                      key={idx}
                      className={styles.previewWordToken}
                      style={{
                        display: "inline-block",
                        marginRight: token.isSpace ? "0.28em" : "0.05em",
                        background: isCurrent
                          ? \`linear-gradient(to right, \${previewLyricActiveColor} \${localPct}%, \${previewInactiveColor} \${localPct}%)\`
                          : undefined,
                        WebkitBackgroundClip: isCurrent ? "text" : undefined,
                        WebkitTextFillColor: isCurrent ? "transparent" : undefined,
                        color: isPast ? previewLyricActiveColor : !isCurrent ? previewInactiveColor : undefined,
                        textShadow: isPast || isCurrent ? \`0 0 20px \${previewPalette?.glow || "rgba(255,255,255,0.4)"}\` : "none",
                      }}
                    >
                      {token.text}
                    </span>
                  );
                })
              ) : (`;

if (!content.includes(oldBlock)) {
  console.error("oldBlock not found in AppleMusicSettingsModal.tsx");
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Types fixed in AppleMusicSettingsModal.tsx!");
