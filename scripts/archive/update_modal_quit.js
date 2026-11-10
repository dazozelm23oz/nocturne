const fs = require('fs');

const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(modalPath, 'utf8');

// 1. Add closeApplication function to AppleMusicSettingsModal
const targetFnPlacement = `const isAutoTheme = settings.theme === "Auto (Match Album)";`;
const closeAppFn = `  const handleQuitApp = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("close_app");
        return;
      }
    } catch {
      // fallback
    }
    try {
      await fetch("/api/system/exit", { method: "POST" });
    } catch {
      // fallback
    }
    if (typeof window !== "undefined") {
      window.close();
    }
  }, []);

  const isAutoTheme = settings.theme === "Auto (Match Album)";`;

if (content.includes(targetFnPlacement)) {
  content = content.replace(targetFnPlacement, closeAppFn);
  console.log('Added handleQuitApp to modal');
} else {
  console.log('targetFnPlacement not found');
}

// 2. Add Quit App button and Close Settings button in header
const oldHeaderClose = `<div className={styles.headerDivider} />

            {/* Close Button at top right corner */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close Settings"
            >
              <GruvboxIcon name="close" size={12} />
            </button>`;

const newHeaderClose = `<div className={styles.headerDivider} />

            {/* Quit Application Button */}
            <button
              type="button"
              className={styles.appCloseBtn}
              onClick={handleQuitApp}
              title="Exit and close application"
              aria-label="Close Application"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
              <span>Quit App</span>
            </button>

            {/* Close Settings Modal Button */}
            <button
              type="button"
              className={styles.closeButtonCircular}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close Settings"
            >
              <GruvboxIcon name="close" size={12} />
            </button>`;

const isCRLF = content.includes('\r\n');
const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldHeaderClose.replace(/\r\n/g, '\n');
const normNew = newHeaderClose.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  let updated = normContent.replace(normOld, normNew);
  if (isCRLF) updated = updated.replace(/\n/g, '\r\n');
  fs.writeFileSync(modalPath, updated, 'utf8');
  console.log('Added Quit App button to settings modal header');
} else {
  console.log('oldHeaderClose not found');
}
