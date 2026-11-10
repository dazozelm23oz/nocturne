const fs = require('fs');

const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let content = fs.readFileSync(modalPath, 'utf8');

const target = `const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";`;

const closeAppFn = `const handleQuitApp = useCallback(async () => {
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

  const isAutoTheme = (settings.theme || "Auto (Album Art)") === "Auto (Album Art)";`;

if (content.includes(target)) {
  content = content.replace(target, closeAppFn);
  fs.writeFileSync(modalPath, content, 'utf8');
  console.log('Successfully added handleQuitApp');
} else {
  console.log('Target still not found');
}
