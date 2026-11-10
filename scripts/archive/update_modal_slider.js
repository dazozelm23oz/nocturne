const fs = require('fs');

const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');

// 1. Add --sparkle-intensity to StudioLivePreviewPane's active preview paragraph style
const targetPreviewStyle = `...(settings.floatAnimation !== "Off" ? previewFloatStyle : {}),`;
const replPreviewStyle = `...(settings.floatAnimation !== "Off" ? previewFloatStyle : {}),
                "--sparkle-intensity": ((settings.particleSparkleIntensity ?? 65) / 100).toFixed(2),`;

if (modalContent.includes(targetPreviewStyle)) {
  modalContent = modalContent.replace(targetPreviewStyle, replPreviewStyle);
  console.log('Added --sparkle-intensity to preview paragraph');
} else {
  console.log('targetPreviewStyle not found!');
}

// 2. Add nested intensity slider under Word Particle Sparkle toggle
const targetSparkleToggle = `          {/* Karaoke Bouncing Indicator */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Karaoke Bouncing Indicator</h3>`;

const sparkleIntensityJSX = `          {/* Sparkle Intensity Nested Slider */}
          {settings.particleSparkle && (
            <div className={\`\${styles.settingRow} \${styles.nested}\`}>
              <div className={styles.leftCol}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div className={styles.textWrapper}>
                  <h3 className={styles.settingName}>Sparkle Intensity</h3>
                  <span className={styles.settingDesc}>
                    Adjust the bloom brilliance, glow radius, and shimmer radiance of active syllables
                  </span>
                </div>
              </div>
              <div className={styles.sliderControlCol}>
                <div className={styles.blurSliderStepperRow}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    disabled={(settings.particleSparkleIntensity ?? 65) <= 5}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        particleSparkleIntensity: Math.max(5, (prev.particleSparkleIntensity ?? 65) - 5),
                      }))
                    }
                    title="Decrease Sparkle Intensity (-5%)"
                    aria-label="Decrease Sparkle Intensity"
                  >
                    −
                  </button>
                  <div className={styles.sliderTrackWrapper}>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={settings.particleSparkleIntensity ?? 65}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            particleSparkleIntensity: val,
                          }));
                        }
                      }}
                      onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        if (!isNaN(val)) {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            particleSparkleIntensity: val,
                          }));
                        }
                      }}
                      className={styles.blurSmoothSlider}
                      style={{
                        background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${Math.max(0, Math.min(100, settings.particleSparkleIntensity ?? 65))}%, \${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} \${Math.max(0, Math.min(100, settings.particleSparkleIntensity ?? 65))}%, \${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)\`,
                      }}
                      title={\`Sparkle Intensity: \${settings.particleSparkleIntensity ?? 65}%\`}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    disabled={(settings.particleSparkleIntensity ?? 65) >= 100}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        particleSparkleIntensity: Math.min(100, (prev.particleSparkleIntensity ?? 65) + 5),
                      }))
                    }
                    title="Increase Sparkle Intensity (+5%)"
                    aria-label="Increase Sparkle Intensity"
                  >
                    +
                  </button>
                  <span className={styles.sliderValueBadge}>
                    {settings.particleSparkleIntensity ?? 65}%
                  </span>
                </div>
              </div>
            </div>
          )}

` + targetSparkleToggle;

const isCRLF = modalContent.includes('\r\n');
const normModal = modalContent.replace(/\r\n/g, '\n');
const normTarget = targetSparkleToggle.replace(/\r\n/g, '\n');
const normSparkleJSX = sparkleIntensityJSX.replace(/\r\n/g, '\n');

if (normModal.includes(normTarget)) {
  let updated = normModal.replace(normTarget, normSparkleJSX);
  if (isCRLF) updated = updated.replace(/\n/g, '\r\n');
  fs.writeFileSync(modalPath, updated, 'utf8');
  console.log('AppleMusicSettingsModal.tsx updated with sparkle intensity slider');
} else {
  console.log('Target block for sparkle toggle not found in AppleMusicSettingsModal.tsx');
}
