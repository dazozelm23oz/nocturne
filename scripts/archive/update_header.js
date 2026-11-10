const fs = require('fs');
const file = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');
const isCrlf = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

const search = `            <h1 className={styles.modalTitle}>
              <span>Nocturne Studio</span>
              <span className={styles.studioHeaderBadge}>
                {viewMode === "split" ? "Split Studio" : viewMode === "docked" ? "Dock Left" : "Dialog"}
              </span>
            </h1>
          </div>

          <div className={styles.headerControls}>
            {/* View Mode Switcher Capsule */}
            <div className={styles.viewModeSwitcher} role="group" aria-label="Layout View Modes">
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Split Studio: Interactive lyrics preview & settings"
              >
                <GruvboxIcon name="split" size={13} />
                <span>Split Studio</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("docked")}
                title="Dock Left: Pinned compact side drawer"
              >
                <GruvboxIcon name="dock" size={13} />
                <span>Dock Left</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("centered")}
                title="Dialog: Centered single window modal"
              >
                <GruvboxIcon name="dialog" size={13} />
                <span>Dialog</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={\`\${styles.previewToggleBtn} \${settings.showLivePreview === false ? styles.previewToggleOff : ""}\`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showLivePreview: prev.showLivePreview === false ? true : false,
                  }))
                }
                title={settings.showLivePreview !== false ? "Hide Live Preview (Full Width Settings)" : "Show Live Preview"}
              >
                <GruvboxIcon name={settings.showLivePreview !== false ? "close" : "image"} size={12} />
                <span>{settings.showLivePreview !== false ? "Hide Preview" : "Show Preview"}</span>
              </button>
            )}

            <div className={styles.headerDivider} />

            {/* Repositioned Sleek Circular Close Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close"
            >
              <GruvboxIcon name="close" size={13} />
            </button>`;

const replace = `            <h1 className={styles.modalTitle}>
              <span>Nocturne Studio</span>
              <span className={styles.studioHeaderBadge}>
                {viewMode === "split" ? "Split" : viewMode === "docked" ? "Dock" : "Window"}
              </span>
            </h1>
          </div>

          <div className={styles.headerControls}>
            {/* View Mode Switcher Capsule */}
            <div className={styles.viewModeSwitcher} role="group" aria-label="Layout View Modes">
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Split: Dual-pane synchronized lyrics and settings"
              >
                <GruvboxIcon name="split" size={13} />
                <span>Split</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("docked")}
                title="Dock: Pinned compact side drawer"
              >
                <GruvboxIcon name="dock" size={13} />
                <span>Dock</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("centered")}
                title="Window: Centered floating settings modal"
              >
                <GruvboxIcon name="dialog" size={13} />
                <span>Window</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode only) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={\`\${styles.previewToggleBtn} \${settings.showLivePreview === false ? styles.previewToggleOff : ""}\`}
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    showLivePreview: prev.showLivePreview === false ? true : false,
                  }))
                }
                title={settings.showLivePreview !== false ? "Hide Live Preview (Full Width Settings)" : "Show Live Preview"}
              >
                <GruvboxIcon name="image" size={12} />
                <span>{settings.showLivePreview !== false ? "Hide Preview" : "Show Preview"}</span>
              </button>
            )}

            <div className={styles.headerDivider} />

            {/* Repositioned Sleek Circular Close Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close Settings"
            >
              <GruvboxIcon name="close" size={12} />
            </button>`;

if (!content.includes(search)) {
  console.error('search string not found in file');
  process.exit(1);
}

content = content.replace(search, replace);
if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated modal header controls!');
