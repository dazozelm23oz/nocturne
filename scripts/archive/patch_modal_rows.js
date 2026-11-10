const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let c = fs.readFileSync(file, 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

// Target the Lyric Accent Gradient section
const oldGradientRow = `          {/* 22. Lyric Accent Gradient */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Accent Gradient</h3>
                <span className={styles.settingDesc}>
                  Select dynamic palette style for singing lyric highlight
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={\`\${styles.dropdownButton} \${openDropdown === "lyricGradient" ? styles.dropdownButtonActive : ""}\`}
                onClick={(e) => toggleDropdown("lyricGradient", e)}
              >
                <span>{settings.lyricGradient}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricGradient" && (
                <div
                  className={\`\${styles.dropdownPopover} \${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }\`}
                  style={{ minWidth: "270px" }}
                >
                  {lyricGradientItems.map((item) => {
                    const isSelected = settings.lyricGradient === item.value;
                    return (
                      <button
                        key={item.value}
                        className={\`\${styles.dropdownItem} \${
                          isSelected ? styles.dropdownItemSelected : ""
                        }\`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricGradient: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>`;

const newRows = `          {/* 22. Lyric Movement & Transition Style */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Movement & Motion Physics</h3>
                <span className={styles.settingDesc}>
                  Transition style when lines advance: Apple TV Kinetic (Reference), Cinematic Snap, Wave Drift, Spring Pop
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={\`\${styles.dropdownButton} \${openDropdown === "lyricMovement" ? styles.dropdownButtonActive : ""}\`}
                onClick={(e) => toggleDropdown("lyricMovement", e)}
              >
                <span>{settings.lyricMovement || "Apple TV Kinetic (Default)"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricMovement" && (
                <div
                  className={\`\${styles.dropdownPopover} \${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }\`}
                  style={{ minWidth: "290px" }}
                >
                  {lyricMovementItems.map((item) => {
                    const isSelected = (settings.lyricMovement || "Apple TV Kinetic (Default)") === item.value;
                    return (
                      <button
                        key={item.value}
                        className={\`\${styles.dropdownItem} \${
                          isSelected ? styles.dropdownItemSelected : ""
                        }\`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricMovement: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 23. Lyric Color & Rainbow Highlight */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Lyric Color & Rainbow Highlight</h3>
                <span className={styles.settingDesc}>
                  Select singing lyric color: Animated Rainbow Spectrum, Espresso Amber, Album Adaptive, or Custom
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {settings.lyricGradient === "Custom Color" && (
                <input
                  type="color"
                  value={settings.customLyricColor || "#f59e0b"}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      customLyricColor: e.target.value,
                    }))
                  }
                  title="Choose custom lyric color"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid var(--btn-neutral-border, rgba(255,255,255,0.2))",
                    cursor: "pointer",
                    background: "transparent",
                    padding: "2px",
                  }}
                />
              )}

              <button
                className={\`\${styles.dropdownButton} \${openDropdown === "lyricGradient" ? styles.dropdownButtonActive : ""}\`}
                onClick={(e) => toggleDropdown("lyricGradient", e)}
              >
                {settings.lyricGradient === "Rainbow Spectrum (Animated)" && (
                  <span style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "linear-gradient(90deg, #ff2a5f, #ffc83b, #06b6d4, #a855f7)",
                    marginRight: "4px"
                  }} />
                )}
                <span>{settings.lyricGradient}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {openDropdown === "lyricGradient" && (
                <div
                  className={\`\${styles.dropdownPopover} \${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }\`}
                  style={{ minWidth: "290px" }}
                >
                  {lyricGradientItems.map((item) => {
                    const isSelected = settings.lyricGradient === item.value;
                    return (
                      <button
                        key={item.value}
                        className={\`\${styles.dropdownItem} \${
                          isSelected ? styles.dropdownItemSelected : ""
                        }\`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricGradient: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 24. Color Application Scope (Standard Across All Songs vs Per-Song) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Color Application Scope</h3>
                <span className={styles.settingDesc}>
                  Apply color universally across all tracks, adapt dynamically per-song from album art, or pin custom color to current song
                </span>
              </div>
            </div>

            <div className={styles.rightCol} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className={\`\${styles.dropdownButton} \${openDropdown === "lyricColorScope" ? styles.dropdownButtonActive : ""}\`}
                onClick={(e) => toggleDropdown("lyricColorScope", e)}
              >
                <span>{settings.lyricColorScope || "Per-Song Adaptive"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {song && (
                <button
                  type="button"
                  className={styles.headerActionPill}
                  style={{ height: "34px", fontSize: "11px", padding: "0 10px" }}
                  onClick={() => {
                    const songKey = song.uri || (song.name && song.artists ? \`\${song.name}-\${song.artists}\` : "");
                    if (songKey) {
                      onUpdateSettings((prev) => ({
                        ...prev,
                        lyricColorScope: "Per-Song Pinned",
                        pinnedSongColors: {
                          ...(prev.pinnedSongColors || {}),
                          [songKey]: prev.lyricGradient,
                        },
                      }));
                    }
                  }}
                  title="Pin current color preset to this specific song"
                >
                  <GruvboxIcon name="heart" size={12} />
                  <span>Pin to Song</span>
                </button>
              )}

              {openDropdown === "lyricColorScope" && (
                <div
                  className={\`\${styles.dropdownPopover} \${
                    dropdownDropUp ? styles.dropdownDropUp : ""
                  }\`}
                  style={{ minWidth: "280px" }}
                >
                  {lyricColorScopeItems.map((item) => {
                    const isSelected = (settings.lyricColorScope || "Per-Song Adaptive") === item.value;
                    return (
                      <button
                        key={item.value}
                        className={\`\${styles.dropdownItem} \${
                          isSelected ? styles.dropdownItemSelected : ""
                        }\`}
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            lyricColorScope: item.value,
                          }));
                          setOpenDropdown(null);
                        }}
                      >
                        {isSelected ? (
                          <div className={styles.selectedBar} />
                        ) : (
                          <div className={styles.emptyBar} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                          <span style={{ fontSize: "11px", opacity: 0.55 }}>{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>`;

if (!c.includes(oldGradientRow)) {
  console.error('oldGradientRow target not found in AppleMusicSettingsModal.tsx!');
  process.exit(1);
}

c = c.replace(oldGradientRow, newRows);

if (isCrlf) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully inserted Lyric Movement, Rainbow, and Color Scope rows!');
