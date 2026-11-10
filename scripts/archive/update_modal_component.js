const fs = require('fs');
let code = fs.readFileSync('components/AppleMusicSettingsModal.tsx', 'utf8');

// 1. Update windowCentered mode class
code = code.replace(
  `viewMode === "split"\n            ? styles.windowSplit\n            : viewMode === "docked"\n            ? styles.windowDocked\n            : ""`,
  `viewMode === "split"\n            ? styles.windowSplit\n            : viewMode === "docked"\n            ? styles.windowDocked\n            : styles.windowCentered`
);
code = code.replace(
  `viewMode === "split"\r\n            ? styles.windowSplit\r\n            : viewMode === "docked"\r\n            ? styles.windowDocked\r\n            : ""`,
  `viewMode === "split"\r\n            ? styles.windowSplit\r\n            : viewMode === "docked"\r\n            ? styles.windowDocked\r\n            : styles.windowCentered`
);

// 2. Fix toggleDropdown to measure relative to modalBody
const oldToggle = `  const toggleDropdown = useCallback(
    (id: string, e?: React.MouseEvent<HTMLButtonElement>) => {
      setOpenDropdown((cur) => {
        if (cur === id) return null;
        if (e && e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          setDropdownDropUp(spaceBelow < 350);
        } else {
          setDropdownDropUp(false);
        }
        return id;
      });
    },
    []
  );`;

const newToggle = `  const toggleDropdown = useCallback(
    (id: string, e?: React.MouseEvent<HTMLButtonElement>) => {
      setOpenDropdown((cur) => {
        if (cur === id) return null;
        if (e && e.currentTarget) {
          const btnRect = e.currentTarget.getBoundingClientRect();
          const modalBody = modalBodyRef.current;
          if (modalBody) {
            const bodyRect = modalBody.getBoundingClientRect();
            const spaceBelow = bodyRect.bottom - btnRect.bottom;
            const spaceAbove = btnRect.top - bodyRect.top;
            setDropdownDropUp(spaceBelow < 220 && spaceAbove > 220);
          } else {
            setDropdownDropUp(window.innerHeight - btnRect.bottom < 250);
          }
        } else {
          setDropdownDropUp(false);
        }
        return id;
      });
    },
    []
  );`;

code = code.replace(oldToggle, newToggle);
code = code.replace(oldToggle.replace(/\n/g, '\r\n'), newToggle.replace(/\n/g, '\r\n'));

// 3. Update previewFont fonts
code = code.replace(
  `  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    previewFont = '"New York", "Playfair Display", "Georgia", serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    previewFont = '"CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    previewFont = '"SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    previewFont = '"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    previewFont = 'Consolas, Monaco, monospace';
  }`,
  `  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  if (settings.fontPreset === "Editorial Serif") {
    previewFont = '"Playfair Display", "Newsreader", "New York", Georgia, serif';
  } else if (settings.fontPreset === "Spotify Circular") {
    previewFont = '"Plus Jakarta Sans", "CircularStd", "Circular", -apple-system, sans-serif';
  } else if (settings.fontPreset === "Spotify Mix") {
    previewFont = '"Montserrat", "SpotifyMix", -apple-system, sans-serif';
  } else if (settings.fontPreset === "SF Pro Display") {
    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
  } else if (settings.fontPreset === "Rounded Bubble") {
    previewFont = '"Nunito", "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';
  } else if (settings.fontPreset === "Custom") {
    previewFont = '"JetBrains Mono", Consolas, Monaco, monospace';
  }`
);
code = code.replace(
  `  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';\r\n  if (settings.fontPreset === "Editorial Serif") {\r\n    previewFont = '"New York", "Playfair Display", "Georgia", serif';\r\n  } else if (settings.fontPreset === "Spotify Circular") {\r\n    previewFont = '"CircularStd", "Circular", -apple-system, sans-serif';\r\n  } else if (settings.fontPreset === "Spotify Mix") {\r\n    previewFont = '"SpotifyMix", -apple-system, sans-serif';\r\n  } else if (settings.fontPreset === "SF Pro Display") {\r\n    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';\r\n  } else if (settings.fontPreset === "Rounded Bubble") {\r\n    previewFont = '"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';\r\n  } else if (settings.fontPreset === "Custom") {\r\n    previewFont = 'Consolas, Monaco, monospace';\r\n  }`,
  `  let previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';\r\n  if (settings.fontPreset === "Editorial Serif") {\r\n    previewFont = '"Playfair Display", "Newsreader", "New York", Georgia, serif';\r\n  } else if (settings.fontPreset === "Spotify Circular") {\r\n    previewFont = '"Plus Jakarta Sans", "CircularStd", "Circular", -apple-system, sans-serif';\r\n  } else if (settings.fontPreset === "Spotify Mix") {\r\n    previewFont = '"Montserrat", "SpotifyMix", -apple-system, sans-serif';\r\n  } else if (settings.fontPreset === "SF Pro Display") {\r\n    previewFont = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';\r\n  } else if (settings.fontPreset === "Rounded Bubble") {\r\n    previewFont = '"Nunito", "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif';\r\n  } else if (settings.fontPreset === "Custom") {\r\n    previewFont = '"JetBrains Mono", Consolas, Monaco, monospace';\r\n  }`
);

// 4. Ensure preview tokens inherit previewFont directly
code = code.replace(
  `className={styles.previewWordToken}\n                        style={{`,
  `className={styles.previewWordToken}\n                        style={{ fontFamily: previewFont,`
);
code = code.replace(
  `className={styles.previewWordToken}\r\n                        style={{`,
  `className={styles.previewWordToken}\r\n                        style={{ fontFamily: previewFont,`
);

// 5. Insert Sync & Spotify controls inside #sec-playback
const secPlaybackOld = `<div id="sec-playback" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="gear" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Playback & System</span>
                <div className={styles.sectionHeaderLine} />
              </div>
              {/* 19. Wavy Progress Bar (Riff) */}`;

const secPlaybackNew = `<div id="sec-playback" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="gear" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Sync & Spotify Controls</span>
                <div className={styles.sectionHeaderLine} />
              </div>

              {/* 1. Lyric Synchronization Calibration (ms) */}
              <div className={styles.settingRow}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <GruvboxIcon name="gear" size={18} />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Lyric Sync Offset (Calibration)</h3>
                    <span className={styles.settingDesc}>
                      Fine-tune lyric synchronization timing. Shift forward if lyrics lag behind music, or backward if lyrics appear too early.
                    </span>
                  </div>
                </div>

                <div className={styles.sliderControlCol}>
                  <div className={styles.blurSliderStepperRow}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      disabled={(settings.syncOffsetMs ?? 0) <= -2000}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: Math.max(-2000, (prev.syncOffsetMs ?? 0) - 50),
                        }))
                      }
                      title="Advance Lyrics (-50ms)"
                    >
                      −
                    </button>

                    <div className={styles.sliderTrackWrapper}>
                      <input
                        type="range"
                        min="-2000"
                        max="2000"
                        step="50"
                        value={settings.syncOffsetMs ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              syncOffsetMs: val,
                            }));
                          }
                        }}
                        onInput={(e) => {
                          const val = parseInt((e.target as HTMLInputElement).value, 10);
                          if (!isNaN(val)) {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              syncOffsetMs: val,
                            }));
                          }
                        }}
                        className={styles.blurSmoothSlider}
                        style={{
                          background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${Math.max(0, Math.min(100, (((settings.syncOffsetMs ?? 0) + 2000) / 4000) * 100))}%, \${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} \${Math.max(0, Math.min(100, (((settings.syncOffsetMs ?? 0) + 2000) / 4000) * 100))}%, \${isLightMode ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.18)"} 100%)\`,
                        }}
                        title={\`Sync Calibration Offset: \${(settings.syncOffsetMs ?? 0) > 0 ? "+" : ""}\${settings.syncOffsetMs ?? 0}ms\`}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.stepperBtn}
                      disabled={(settings.syncOffsetMs ?? 0) >= 2000}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: Math.min(2000, (prev.syncOffsetMs ?? 0) + 50),
                        }))
                      }
                      title="Delay Lyrics (+50ms)"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className={styles.stepperBtn}
                      style={{ fontSize: 11, width: "auto", padding: "0 8px" }}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          syncOffsetMs: 0,
                        }))
                      }
                      title="Reset to 0ms (Default Sync)"
                    >
                      Reset
                    </button>

                    <span className={styles.sliderValueBadge}>
                      {(settings.syncOffsetMs ?? 0) > 0 ? \`+\${settings.syncOffsetMs}ms\` : \`\${settings.syncOffsetMs ?? 0}ms\`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Spotify Desktop SMTC Bridge Status */}
              <div className={styles.settingRow}>
                <div className={styles.leftCol}>
                  <div className={styles.iconWrapper}>
                    <GruvboxIcon name="link" size={18} />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3 className={styles.settingName}>Spotify SMTC Desktop Bridge</h3>
                    <span className={styles.settingDesc}>
                      Direct Windows WinRT Media Transport Session. Tracks progress and dispatches play, skip, seek, and lyrics with 0ms focus lag.
                    </span>
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 9999,
                      background: "rgba(var(--palette-primary-rgb, 30, 215, 96), 0.15)",
                      color: "var(--palette-primary, #1ed760)",
                      border: "1px solid rgba(var(--palette-primary-rgb, 30, 215, 96), 0.3)",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--palette-primary, #1ed760)",
                        boxShadow: "0 0 8px var(--palette-primary, #1ed760)",
                      }}
                    />
                    Spotify Desktop: Active
                  </span>
                </div>
              </div>

              {/* 19. Wavy Progress Bar (Riff) */}`;

code = code.replace(secPlaybackOld, secPlaybackNew);
code = code.replace(secPlaybackOld.replace(/\n/g, '\r\n'), secPlaybackNew.replace(/\n/g, '\r\n'));

// 6. Fix previewContainer in centered mode so it only renders when showLivePreview !== false
code = code.replace(
  `{viewMode === "centered" && (`,
  `{viewMode === "centered" && settings.showLivePreview !== false && (`
);

fs.writeFileSync('components/AppleMusicSettingsModal.tsx', code, 'utf8');
console.log('components/AppleMusicSettingsModal.tsx updated');
