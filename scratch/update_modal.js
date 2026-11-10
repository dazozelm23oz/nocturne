const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Apple TV Cinema View')) {
  const target = '{/* Animated time status */}';
  const cinemaBlock = `{/* Apple TV Cinema View (Auto-Hide Controls) */}
          <div className={styles.settingRow}>
            <div className={styles.leftCol}>
              <div className={styles.settingIcon}>
                <GruvboxIcon name="eye" size={18} color="var(--palette-primary)" />
              </div>
              <div className={styles.textWrapper}>
                <h3 className={styles.settingName}>Apple TV Cinema View</h3>
                <span className={styles.settingDesc}>
                  Auto-hide playback scrubber & controls when idle for an uncluttered TV experience
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <button
                className={\`\${styles.toggleSwitch} \${
                  settings.cinemaMode ? styles.active : ""
                }\`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    cinemaMode: !prev.cinemaMode,
                  }))
                }
                aria-label="Toggle Apple TV cinema view"
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* Animated time status */}`;

  code = code.replace(target, cinemaBlock);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Added Apple TV Cinema View to settings modal');
} else {
  console.log('Already present');
}
