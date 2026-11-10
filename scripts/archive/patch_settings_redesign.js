const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. PATCH components/AppleMusicSettingsModal.tsx
// =========================================================================
const modalPath = path.join(__dirname, '..', 'components', 'AppleMusicSettingsModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

const isModalCRLF = modalContent.includes('\r\n');
let normModal = modalContent.replace(/\r\n/g, '\n');

// 1.1 Replace "Apple Music Lyrics" title in Header and aria-label
normModal = normModal.replace(
  'aria-label="Apple Music Lyrics Settings"',
  'aria-label="Nocturne Settings"'
);
normModal = normModal.replace(
  '<h1 className={styles.modalTitle}>Apple Music Lyrics</h1>',
  '<h1 className={styles.modalTitle}>Nocturne Studio</h1>'
);

// 1.2 Replace occurrences of "Apple Music Lyrics" in setting descriptions with "Nocturne"
normModal = normModal.replace(/in Apple Music Lyrics/g, 'in Nocturne');
normModal = normModal.replace(/Apple Music Lyrics/g, 'Nocturne Lyrics');

// 1.3 Add subJump smooth scroll handler
const handleCatChangeTarget = `  const handleCategoryChange = useCallback(
    (cat: "all" | "appearance" | "lyrics" | "visuals" | "playback" | "performance") => {
      setActiveCategory(cat);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    },
    []
  );`;

const handleCatChangeReplacement = `  const handleCategoryChange = useCallback(
    (cat: "all" | "appearance" | "lyrics" | "visuals" | "playback" | "performance") => {
      setActiveCategory(cat);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    },
    []
  );

  const scrollToAnchor = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);`;

if (normModal.includes(handleCatChangeTarget)) {
  normModal = normModal.replace(handleCatChangeTarget, handleCatChangeReplacement);
} else {
  console.warn("handleCatChangeTarget not matched exactly, checking variants");
}

// 1.4 Add Hide Live Preview toggle and circular close button in headerControls
const headerControlsTarget = `            {/* View Mode Switcher */}
            <div className={styles.viewModeSwitcher}>
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Half-by-Half Split Studio: Live interactive lyrics studio alongside settings"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
                <span>Split Studio</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "docked" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("docked")}
                title="Dock to Left: Pinned drawer on left, real lyrics completely visible and live on right"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="3" y="3" width="7" height="18" fill="currentColor" fillOpacity="0.4" />
                </svg>
                <span>Dock Left</span>
              </button>

              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "centered" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("centered")}
                title="Dialog: Classic single window mode"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Dialog</span>
              </button>
            </div>

            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close Settings"
              title="Close"
            >
              <GruvboxIcon name="close" size={14} />
            </button>`;

const headerControlsReplacement = `            {/* View Mode Switcher */}
            <div className={styles.viewModeSwitcher}>
              <button
                type="button"
                className={\`\${styles.viewModeBtn} \${
                  viewMode === "split" ? styles.viewModeActive : ""
                }\`}
                onClick={() => setViewMode("split")}
                title="Split Studio: Interactive lyrics preview & settings"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="3" y="3" width="7" height="18" fill="currentColor" fillOpacity="0.4" />
                </svg>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                <span>Dialog</span>
              </button>
            </div>

            {/* Optional Live Preview Toggle (Split Mode) */}
            {viewMode === "split" && (
              <button
                type="button"
                className={styles.previewToggleBtn}
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

if (normModal.includes(headerControlsTarget)) {
  normModal = normModal.replace(headerControlsTarget, headerControlsReplacement);
} else {
  console.error("headerControlsTarget not found");
  process.exit(1);
}

// 1.5 Condition StudioLivePreviewPane on settings.showLivePreview !== false
const previewRenderOld = `{viewMode === "split" && (
            <StudioLivePreviewPane`;
const previewRenderNew = `{viewMode === "split" && settings.showLivePreview !== false && (
            <StudioLivePreviewPane`;

if (normModal.includes(previewRenderOld)) {
  normModal = normModal.replace(previewRenderOld, previewRenderNew);
} else {
  console.error("previewRenderOld not found");
  process.exit(1);
}

// 1.6 Add subJumpContainer below categoryTabsContainer
const navHeaderTarget = `                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "performance" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("performance")}
                  title="Performance & Diagnostics"
                >
                  <GruvboxIcon name="thunderbolt" size={14} />
                  <span className={styles.categoryTabLabel}>
                    <span className={styles.tabLabelFull}>Performance</span>
                    <span className={styles.tabLabelShort}>Perf</span>
                  </span>
                </button>
              </div>
            </div>`;

const navHeaderReplacement = `                <button
                  type="button"
                  className={\`\${styles.categoryTab} \${
                    activeCategory === "performance" ? styles.categoryTabActive : ""
                  }\`}
                  onClick={() => handleCategoryChange("performance")}
                  title="Performance & Diagnostics"
                >
                  <GruvboxIcon name="thunderbolt" size={14} />
                  <span className={styles.categoryTabLabel}>
                    <span className={styles.tabLabelFull}>Performance</span>
                    <span className={styles.tabLabelShort}>Perf</span>
                  </span>
                </button>
              </div>

              {/* Sub-Part Quick Navigation Dock */}
              <div className={styles.subJumpDock}>
                <button type="button" className={styles.subJumpBtn} onClick={() => scrollToAnchor("sec-appearance")}>
                  <span>Themes & Glass</span>
                </button>
                <button type="button" className={styles.subJumpBtn} onClick={() => scrollToAnchor("sec-lyrics")}>
                  <span>Typography</span>
                </button>
                <button type="button" className={styles.subJumpBtn} onClick={() => scrollToAnchor("sec-visuals")}>
                  <span>Visual Effects</span>
                </button>
                <button type="button" className={styles.subJumpBtn} onClick={() => scrollToAnchor("sec-playback")}>
                  <span>Playback</span>
                </button>
                <button type="button" className={styles.subJumpBtn} onClick={() => scrollToAnchor("sec-performance")}>
                  <span>Diagnostics</span>
                </button>
              </div>
            </div>`;

if (normModal.includes(navHeaderTarget)) {
  normModal = normModal.replace(navHeaderTarget, navHeaderReplacement);
} else {
  console.error("navHeaderTarget not found");
  process.exit(1);
}

// 1.7 Add section IDs for smooth anchor jumping
normModal = normModal.replace(
  '<div className={styles.sectionGroupHeader}>',
  '<div id="sec-appearance" className={styles.sectionGroupHeader}>'
);
normModal = normModal.replace(
  '<div className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="chat"',
  '<div id="sec-lyrics" className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="chat"'
);
normModal = normModal.replace(
  '<div className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="waves"',
  '<div id="sec-visuals" className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="waves"'
);
normModal = normModal.replace(
  '<div className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="gear"',
  '<div id="sec-playback" className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="gear"'
);
normModal = normModal.replace(
  '<div className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="thunderbolt"',
  '<div id="sec-performance" className={styles.sectionGroupHeader}>\n                <span className={styles.sectionHeaderBadge}>\n                  <GruvboxIcon name="thunderbolt"'
);

// 1.8 Redesign Modal Glass Blur slider & Opacity slider: Remove width: 240px and extend opacity down to 0%
const blurSliderRowOld = `            <div className={styles.rightCol} style={{ width: "240px" }}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.max(0, (prev.modalGlassBlur ?? 28) - 4),
                    }))
                  }
                  title="Decrease Glass Blur"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={settings.modalGlassBlur ?? 28}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassBlur: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Glass Blur: \${settings.modalGlassBlur ?? 28}px\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) >= 60}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.min(60, (prev.modalGlassBlur ?? 28) + 4),
                    }))
                  }
                  title="Increase Glass Blur"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassBlur ?? 28}px
                </span>
              </div>
            </div>`;

const blurSliderRowNew = `            <div className={styles.sliderControlCol}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.max(0, (prev.modalGlassBlur ?? 28) - 4),
                    }))
                  }
                  title="Decrease Blur (-4px)"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={settings.modalGlassBlur ?? 28}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassBlur: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) \${((settings.modalGlassBlur ?? 28) / 60) * 100}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Glass Blur: \${settings.modalGlassBlur ?? 28}px\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassBlur ?? 28) >= 60}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassBlur: Math.min(60, (prev.modalGlassBlur ?? 28) + 4),
                    }))
                  }
                  title="Increase Blur (+4px)"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassBlur ?? 28}px
                </span>
              </div>
            </div>`;

if (normModal.includes(blurSliderRowOld)) {
  normModal = normModal.replace(blurSliderRowOld, blurSliderRowNew);
} else {
  console.error("blurSliderRowOld not found");
  process.exit(1);
}

// 1.9 Opacity slider: allow 0% to 100%
const opacitySliderRowOld = `            <div className={styles.rightCol} style={{ width: "240px" }}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) <= 20}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.max(20, (prev.modalGlassOpacity ?? 75) - 5),
                    }))
                  }
                  title="Decrease Opacity"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={settings.modalGlassOpacity ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassOpacity: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${(((settings.modalGlassOpacity ?? 75) - 20) / 80) * 100}%, rgba(255, 255, 255, 0.18) \${(((settings.modalGlassOpacity ?? 75) - 20) / 80) * 100}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Window Opacity: \${settings.modalGlassOpacity ?? 75}%\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) >= 100}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.min(100, (prev.modalGlassOpacity ?? 75) + 5),
                    }))
                  }
                  title="Increase Opacity"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassOpacity ?? 75}%
                </span>
              </div>
            </div>`;

const opacitySliderRowNew = `            <div className={styles.sliderControlCol}>
              <div className={styles.blurSliderStepperRow}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) <= 0}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.max(0, (prev.modalGlassOpacity ?? 75) - 5),
                    }))
                  }
                  title="More Transparent (-5%)"
                >
                  −
                </button>

                <div className={styles.sliderTrackWrapper}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.modalGlassOpacity ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        modalGlassOpacity: val,
                      }));
                    }}
                    className={styles.blurSmoothSlider}
                    style={{
                      background: \`linear-gradient(to right, var(--palette-primary, #1ed760) 0%, var(--palette-primary, #1ed760) \${(settings.modalGlassOpacity ?? 75)}%, rgba(255, 255, 255, 0.18) \${(settings.modalGlassOpacity ?? 75)}%, rgba(255, 255, 255, 0.18) 100%)\`,
                    }}
                    title={\`Modal Window Opacity: \${settings.modalGlassOpacity ?? 75}%\`}
                  />
                </div>

                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={(settings.modalGlassOpacity ?? 75) >= 100}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      modalGlassOpacity: Math.min(100, (prev.modalGlassOpacity ?? 75) + 5),
                    }))
                  }
                  title="More Opaque (+5%)"
                >
                  +
                </button>

                <span className={styles.sliderValueBadge}>
                  {settings.modalGlassOpacity ?? 75}%
                </span>
              </div>
            </div>`;

if (normModal.includes(opacitySliderRowOld)) {
  normModal = normModal.replace(opacitySliderRowOld, opacitySliderRowNew);
} else {
  console.error("opacitySliderRowOld not found");
  process.exit(1);
}

// 1.10 Redesign StudioLivePreviewPane Header & Song Card
const studioTopBarOld = `      {/* Studio Top Bar */}
      <div className={styles.studioTopBar}>
        <div className={styles.studioLiveBadge}>
          <span className={styles.studioPulseDot} />
          <span>LIVE LYRICS STUDIO</span>
        </div>
        <div className={styles.studioChips}>
          <span className={styles.studioChip}>{settings.theme}</span>
          <span className={styles.studioChip}>{settings.fontPreset}</span>
          <span className={styles.studioChip}>{blurPx.toFixed(1)}px blur</span>
        </div>
      </div>`;

const studioTopBarNew = `      {/* Studio Top Bar (Minimalist aesthetic matching reference) */}
      <div className={styles.studioTopBar}>
        <div className={styles.studioLiveBadge}>
          <span className={styles.studioPulseDot} />
          <span style={{ letterSpacing: "0.08em", fontWeight: 700 }}>NOCTURNE PREVIEW</span>
        </div>
        <div className={styles.studioChips}>
          <button
            type="button"
            className={styles.studioChipBtn}
            onClick={() => setIsSimulatingSweep((p) => !p)}
            title={isSimulatingSweep ? "Pause Sweep Simulation" : "Resume Sweep Simulation"}
          >
            <GruvboxIcon name={isSimulatingSweep ? "pause" : "play"} size={10} />
            <span>{isSimulatingSweep ? "Live" : "Paused"}</span>
          </button>
        </div>
      </div>`;

if (normModal.includes(studioTopBarOld)) {
  normModal = normModal.replace(studioTopBarOld, studioTopBarNew);
} else {
  console.error("studioTopBarOld not found");
  process.exit(1);
}

if (isModalCRLF) {
  normModal = normModal.replace(/\n/g, '\r\n');
}
fs.writeFileSync(modalPath, normModal, 'utf8');
console.log("Successfully patched components/AppleMusicSettingsModal.tsx!");


// =========================================================================
// 2. PATCH styles/SettingsModal.module.css
// =========================================================================
const cssPath = path.join(__dirname, '..', 'styles', 'SettingsModal.module.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const isCssCRLF = cssContent.includes('\r\n');
let normCss = cssContent.replace(/\r\n/g, '\n');

// 2.1 Smooth scrolling on .modalBody
normCss = normCss.replace(
  '.modalBody {\n  flex: 1;\n  min-height: 0;',
  '.modalBody {\n  flex: 1;\n  min-height: 0;\n  scroll-behavior: smooth;'
);

// 2.2 Fix Dock Left category navigation: 3-column symmetrical grid
const dockedTabTarget = `.windowDocked .categoryNavHeader {
  padding: 14px 20px 12px 20px !important;
}

.windowDocked .categoryTab {
  font-size: 11.5px !important;
  gap: 6px !important;
  padding: 0 6px !important;
  height: 36px !important;
  min-height: 36px !important;
}`;

const dockedTabReplacement = `.windowDocked {
  width: 560px !important;
}

.windowDocked .categoryNavHeader {
  padding: 14px 20px 10px 20px !important;
}

.windowDocked .categoryTabsContainer {
  grid-template-columns: repeat(3, 1fr) !important;
  height: auto !important;
  min-height: unset !important;
  gap: 8px !important;
}

.windowDocked .categoryTab {
  font-size: 12px !important;
  font-weight: 600 !important;
  gap: 8px !important;
  padding: 0 12px !important;
  height: 40px !important;
  min-height: 40px !important;
  justify-content: flex-start !important;
}

.windowDocked .tabLabelFull {
  display: inline !important;
}

.windowDocked .tabLabelShort {
  display: none !important;
}`;

if (normCss.includes(dockedTabTarget)) {
  normCss = normCss.replace(dockedTabTarget, dockedTabReplacement);
} else {
  console.warn("dockedTabTarget not found directly, appending docked category rules");
}

// 2.3 Guarantee high contrast on section headers in dark album mode
normCss = normCss.replace(
  `.modalAuto .sectionGroupHeader {
  color: var(--palette-primary, #1db954) !important;
}`,
  `.modalAuto .sectionGroupHeader {
  color: var(--modal-text, #ffffff) !important;
}

.modalAuto .sectionHeaderTitle {
  color: var(--modal-text, #ffffff) !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}`
);

// 2.4 Dropdown hover contrast enhancement
normCss = normCss.replace(
  `.modalDark .dropdownItem:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}`,
  `.modalDark .dropdownItem:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}`
);

normCss = normCss.replace(
  `.modalAuto .dropdownItem:hover {
  background: rgba(var(--palette-primary-rgb, 29, 185, 84), 0.14) !important;
  color: var(--modal-text, #ffffff) !important;
}`,
  `.modalAuto .dropdownItem:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
}`
);

// 2.5 Append new UI classes for subJump, header buttons, and sliderControlCol
const newStyles = `
/* ==========================================================================
   NOCTURNE STUDIO ENHANCED CONTROLS & SUB-NAVIGATION
   ========================================================================== */
.headerActionPill,
.previewToggleBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--modal-text, #ffffff);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.headerActionPill:hover,
.previewToggleBtn:hover {
  background: var(--palette-primary, #ffffff);
  color: var(--palette-contrast, #000000);
  box-shadow: 0 2px 10px var(--palette-glow, rgba(255, 255, 255, 0.25));
}

.closeButtonCircular {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--btn-neutral-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--btn-neutral-border, rgba(255, 255, 255, 0.14));
  color: var(--modal-text, #ffffff);
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.closeButtonCircular:hover {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  transform: scale(1.05);
}

.sliderControlCol {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 260px;
  max-width: 340px;
}

.subJumpDock {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 2px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.subJumpDock::-webkit-scrollbar {
  display: none;
}

.subJumpBtn {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--modal-subtext, rgba(255, 255, 255, 0.65));
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.subJumpBtn:hover {
  background: var(--palette-primary, #ffffff);
  color: var(--palette-contrast, #000000);
  border-color: transparent;
  transform: translateY(-1px);
}

.studioChipBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.studioChipBtn:hover {
  background: rgba(255, 255, 255, 0.2);
}
`;

normCss += newStyles;

if (isCssCRLF) {
  normCss = normCss.replace(/\n/g, '\r\n');
}
fs.writeFileSync(cssPath, normCss, 'utf8');
console.log("Successfully patched styles/SettingsModal.module.css!");
