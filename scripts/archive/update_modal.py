import os

path = r'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\components\AppleMusicSettingsModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

markers = [
    '{/* 0. Theme */}',
    '{/* 1. Background */}',
    '{/* 2. Palette algorithm */}',
    '{/* 3. Blur lyrics */}',
    '{/* 4. REDESIGNED BLUR LEVEL CONTROL: Full-Width Card with Zero Overflow */}',
    '{/* 5. Auto unblur */}',
    '{/* 6. Bold Text */}',
    '{/* 7. Font preset */}',
    '{/* 8. Karaoke mode (Master Toggle & Accordion Header) */}',
    '{/* 9. Duet view */}',
    '{/* 10. Right alignment first */}',
    '{/* 11. Pulling effect */}',
    '{/* Animated time status */}',
    '{/* 15. Zooming restore */}',
    '{/* 16. Style preset */}',
    '{/* 17. Prevent sleep */}',
    '{/* 18. FPS overlay */}',
    '{/* 19. Wavy Progress Bar (Riff) */}',
    '{/* 20. Lyric Animation Curve */}',
    '{/* 21. Lyric Animation Speed */}',
    '{/* 22. Lyric Accent Gradient */}',
]

indices = [content.find(m) for m in markers]
for i, m in enumerate(markers):
    if indices[i] == -1:
        raise ValueError(f"Marker not found: {m}")

end_marker = content.find('\n          </div>\n        </div>\n      </div>\n    </div>', indices[-1])
if end_marker == -1:
    raise ValueError("End marker not found")

blocks = {}
for i in range(len(markers)):
    start = indices[i]
    end = indices[i+1] if i+1 < len(markers) else end_marker
    blocks[markers[i]] = content[start:end].rstrip()

visual_effects_code = """          {/* 23. Audio Reactive Spectrum Visualizer */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10v4" />
                  <path d="M6 6v12" />
                  <path d="M10 3v18" />
                  <path d="M14 7v10" />
                  <path d="M18 5v14" />
                  <path d="M22 10v4" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Audio Reactive Spectrum Visualizer</h3>
                <span className={styles.settingDesc}>
                  Fluid frequency bars and audio sound waves dancing at the bottom of the lyrics
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.spectrumVisualizer ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    spectrumVisualizer: !prev.spectrumVisualizer,
                  }))
                }
                aria-label="Toggle audio spectrum visualizer"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 24. Instrumental Break Dots (•••) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="19" cy="12" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Instrumental Break Dots (•••)</h3>
                <span className={styles.settingDesc}>
                  Animated pulsing dots with countdown to the next vocal line during long solos
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.instrumentalBreaks ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    instrumentalBreaks: !prev.instrumentalBreaks,
                  }))
                }
                aria-label="Toggle instrumental break dots"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 25. Vinyl Turntable Player Mode */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="18.5" y1="5.5" x2="16.5" y2="7.5" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Vinyl Turntable Player Mode</h3>
                <span className={styles.settingDesc}>
                  Display album artwork as a spinning vinyl record with animated realistic tonearm
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.vinylMode ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    vinylMode: !prev.vinylMode,
                  }))
                }
                aria-label="Toggle vinyl turntable mode"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 26. 3D Fluid Aurora Mesh Orbs */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <circle cx="15" cy="15" r="6" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>3D Fluid Aurora Mesh Orbs</h3>
                <span className={styles.settingDesc}>
                  Multi-layer luminous orbs drifting and blending behind lyrics based on album colors
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.auroraMeshOrbs ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    auroraMeshOrbs: !prev.auroraMeshOrbs,
                  }))
                }
                aria-label="Toggle 3D fluid aurora mesh orbs"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 27. Album Cover Ambient Edge Glow */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.iconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="16" x="4" y="4" rx="3" />
                  <path d="M4 8h16" />
                  <path d="M8 4v16" />
                </svg>
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Album Cover Ambient Edge Glow</h3>
                <span className={styles.settingDesc}>
                  Soft neon halo surrounding the album art that breathes in time with playback
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={`${styles.toggleSwitch} ${
                  settings.albumEdgeGlow ? styles.active : ""
                }`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    albumEdgeGlow: !prev.albumEdgeGlow,
                  }))
                }
                aria-label="Toggle album cover ambient edge glow"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>"""

category_tabs_code = """          {/* Category Filter Navigation Tabs */}
          <div className={styles.categoryTabsContainer}>
            <button
              type="button"
              className={`${styles.categoryTab} ${
                activeCategory === "all" ? styles.categoryTabActive : ""
              }`}
              onClick={() => setActiveCategory("all")}
            >
              <span>✨</span>
              <span>All</span>
            </button>
            <button
              type="button"
              className={`${styles.categoryTab} ${
                activeCategory === "appearance" ? styles.categoryTabActive : ""
              }`}
              onClick={() => setActiveCategory("appearance")}
            >
              <span>🎨</span>
              <span>Appearance</span>
            </button>
            <button
              type="button"
              className={`${styles.categoryTab} ${
                activeCategory === "lyrics" ? styles.categoryTabActive : ""
              }`}
              onClick={() => setActiveCategory("lyrics")}
            >
              <span>💬</span>
              <span>Lyrics</span>
            </button>
            <button
              type="button"
              className={`${styles.categoryTab} ${
                activeCategory === "visuals" ? styles.categoryTabActive : ""
              }`}
              onClick={() => setActiveCategory("visuals")}
            >
              <span>🌊</span>
              <span>Visual Effects</span>
            </button>
            <button
              type="button"
              className={`${styles.categoryTab} ${
                activeCategory === "playback" ? styles.categoryTabActive : ""
              }`}
              onClick={() => setActiveCategory("playback")}
            >
              <span>⚙️</span>
              <span>Playback & System</span>
            </button>
          </div>"""

group_appearance = f"""          {{(activeCategory === "all" || activeCategory === "appearance") && (
            <>
              <div className={{styles.sectionGroupHeader}}>
                <span className={{styles.sectionHeaderBadge}}>🎨</span>
                <span className={{styles.sectionHeaderTitle}}>Appearance & Themes</span>
                <div className={{styles.sectionHeaderLine}} />
              </div>
              {blocks['{/* 0. Theme */}']}
              {blocks['{/* 1. Background */}']}
              {blocks['{/* 2. Palette algorithm */}']}
              {blocks['{/* 16. Style preset */}']}
              {blocks['{/* 7. Font preset */}']}
              {blocks['{/* 6. Bold Text */}']}
            </>
          )}}"""

group_lyrics = f"""          {{(activeCategory === "all" || activeCategory === "lyrics") && (
            <>
              <div className={{styles.sectionGroupHeader}}>
                <span className={{styles.sectionHeaderBadge}}>💬</span>
                <span className={{styles.sectionHeaderTitle}}>Lyrics & Typography</span>
                <div className={{styles.sectionHeaderLine}} />
              </div>
              {blocks['{/* 3. Blur lyrics */}']}
              {blocks['{/* 4. REDESIGNED BLUR LEVEL CONTROL: Full-Width Card with Zero Overflow */}']}
              {blocks['{/* 5. Auto unblur */}']}
              {blocks['{/* 8. Karaoke mode (Master Toggle & Accordion Header) */}']}
              {blocks['{/* 9. Duet view */}']}
              {blocks['{/* 10. Right alignment first */}']}
              {blocks['{/* 20. Lyric Animation Curve */}']}
              {blocks['{/* 21. Lyric Animation Speed */}']}
              {blocks['{/* 22. Lyric Accent Gradient */}']}
            </>
          )}}"""

group_visuals = f"""          {{(activeCategory === "all" || activeCategory === "visuals") && (
            <>
              <div className={{styles.sectionGroupHeader}}>
                <span className={{styles.sectionHeaderBadge}}>🌊</span>
                <span className={{styles.sectionHeaderTitle}}>Visual Effects & Visualizer</span>
                <div className={{styles.sectionHeaderLine}} />
              </div>
{visual_effects_code}
            </>
          )}}"""

group_playback = f"""          {{(activeCategory === "all" || activeCategory === "playback") && (
            <>
              <div className={{styles.sectionGroupHeader}}>
                <span className={{styles.sectionHeaderBadge}}>⚙️</span>
                <span className={{styles.sectionHeaderTitle}}>Playback & System</span>
                <div className={{styles.sectionHeaderLine}} />
              </div>
              {blocks['{/* 19. Wavy Progress Bar (Riff) */}']}
              {blocks['{/* Animated time status */}']}
              {blocks['{/* 11. Pulling effect */}']}
              {blocks['{/* 15. Zooming restore */}']}
              {blocks['{/* 17. Prevent sleep */}']}
              {blocks['{/* 18. FPS overlay */}']}
            </>
          )}}"""

new_body_content = '\n\n'.join([
    category_tabs_code,
    group_appearance,
    group_lyrics,
    group_visuals,
    group_playback,
])

final_content = content[:indices[0]] + new_body_content + '\n' + content[end_marker:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print('Successfully categorized and wrote AppleMusicSettingsModal.tsx!')
