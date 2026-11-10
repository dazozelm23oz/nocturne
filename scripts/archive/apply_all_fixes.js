const fs = require('fs');

// 1. Patch pages/index.tsx
{
  const indexPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/pages/index.tsx';
  let indexContent = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');
  const oldWavy = `                          <RiffWavyProgressBar
                            currentTime={displayTime}
                            duration={song.duration ? song.duration / 1000 : 0}
                            isPlaying={data?.is_playing || false}`;
  const newWavy = `                          <RiffWavyProgressBar
                            currentTime={displayTime}
                            duration={song.duration ? song.duration / 1000 : 0}
                            isPlaying={!showSettingsModal && (data?.is_playing || false)}`;
  if (indexContent.includes(oldWavy)) {
    indexContent = indexContent.replace(oldWavy, newWavy);
    fs.writeFileSync(indexPath, indexContent.replace(/\n/g, '\r\n'), 'utf8');
    console.log("pages/index.tsx patched successfully!");
  } else {
    console.warn("oldWavy not found in index.tsx");
  }
}

// 2. Patch components/AppleMusicSettingsModal.tsx
{
  const modalPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
  let modalContent = fs.readFileSync(modalPath, 'utf8').replace(/\r\n/g, '\n');

  // Fix isPerfActive
  const oldPerfActive = `const isPerfActive = isOpen && (activeCategory === "all" || activeCategory === "performance");`;
  const newPerfActive = `const isPerfActive = isOpen && activeCategory === "performance";`;
  if (modalContent.includes(oldPerfActive)) {
    modalContent = modalContent.replace(oldPerfActive, newPerfActive);
    console.log("isPerfActive patched!");
  }

  // Fix scrollToAnchor
  const oldScroll = `  const scrollToAnchor = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);`;

  const newScroll = `  const scrollToAnchor = useCallback((id: string) => {
    const container = modalBodyRef.current;
    const el = document.getElementById(id);
    if (container && el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: Math.max(0, relativeTop - 12), behavior: "smooth" });
    }
  }, []);`;

  if (modalContent.includes(oldScroll)) {
    modalContent = modalContent.replace(oldScroll, newScroll);
    console.log("scrollToAnchor patched!");
  }

  // Replace StudioLivePreviewPane with pure lyrics preview (no banner, no play/replay/scrubber)
  // Let's locate StudioLivePreviewPane start and end
  const startMarker = `const StudioLivePreviewPane = React.memo(function StudioLivePreviewPane({`;
  const endMarker = `export default function AppleMusicSettingsModal({`;

  const startIndex = modalContent.indexOf(startMarker);
  const endIndex = modalContent.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const newStudioPane = `const StudioLivePreviewPane = React.memo(function StudioLivePreviewPane({
  settings,
  song,
  songImage,
  previewPalette,
  blurPx,
  previewFont,
  previewScale,
  previewActiveSize,
  previewInactiveColor,
  previewLyricActiveColor,
  previewOverlayBg,
  previewFloatStyle,
  previewAmbientStyle,
  linePrev,
  lineActive,
  lineNext,
  isLightMode,
  currentPullPower,
  onLeftPaneWheel,
}: StudioLivePreviewProps) {
  const [previewSweepProgress, setPreviewSweepProgress] = useState<number>(45);
  const activeTokens = useMemo(() => tokenizeLyric(lineActive), [lineActive]);

  // Smooth RAF sweep loop for karaoke lyric sweep preview
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setPreviewSweepProgress((prev) => {
        const next = prev + (deltaSec / 3.4) * 100;
        return next >= 100 ? 0 : next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const previewDynamicSweepBg = isLightMode
    ? \`linear-gradient(to right, \${previewLyricActiveColor} 0%, \${previewLyricActiveColor} \${previewSweepProgress}%, rgba(20, 20, 24, 0.35) \${previewSweepProgress + 3}%, rgba(20, 20, 24, 0.35) 100%)\`
    : \`linear-gradient(to right, \${previewLyricActiveColor} 0%, \${previewLyricActiveColor} \${previewSweepProgress}%, rgba(255, 255, 255, 0.4) \${previewSweepProgress + 3}%, rgba(255, 255, 255, 0.4) 100%)\`;

  return (
    <div className={styles.previewStudioPane} onWheel={onLeftPaneWheel}>
      {/* Pure Lyrics Stage - Clean, unencumbered preview */}
      <div className={styles.studioStage} style={{ position: "relative", overflow: "hidden", height: "100%" }}>
        <div
          className={styles.previewAmbient}
          style={previewAmbientStyle}
        />
        {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
          <AuroraMeshOrbs
            palette={previewPalette}
            isPlaying={true}
            isLightMode={isLightMode}
          />
        )}
        {settings.ambientStardust && (
          <AmbientStardust
            isPlaying={true}
            primaryColor={previewPalette?.primary}
            isLightMode={isLightMode}
          />
        )}
        <div
          className={styles.previewOverlay}
          style={{
            background: previewOverlayBg,
          }}
        />

        <div className={styles.studioElasticWrap}>
          {/* Lyrics Presentation: Pure Synchronized Lyrics */}
          <div
            className={styles.studioLyricsBox}
            style={{
              alignItems: settings.rightAlignFirst ? "flex-end" : "center",
              textAlign: settings.rightAlignFirst ? "right" : "center",
            }}
          >
            {/* Previous Inactive Line */}
            <p
              className={styles.previewInactiveLine}
              style={{
                filter: \`blur(\${blurPx}px)\`,
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 800 : 600,
                color: previewInactiveColor,
              }}
            >
              {linePrev}
            </p>

            {/* Instrumental Break Dots Preview */}
            {settings.instrumentalBreaks && (
              <div
                style={{
                  display: "flex",
                  justifyContent: settings.rightAlignFirst ? "flex-end" : "center",
                  width: "100%",
                  margin: "6px 0",
                }}
              >
                <InstrumentalBreak
                  remainingSeconds={Math.max(0, 4 - Math.floor(previewSweepProgress / 25))}
                  totalSeconds={4}
                  isActive={previewSweepProgress < 35}
                  primaryColor={previewLyricActiveColor}
                  isLightMode={isLightMode}
                />
              </div>
            )}

            {/* Active Singing Line (Sequential Multi-Line Sweep) */}
            <p
              className={\`\${styles.previewActiveLine} \${
                settings.wordShine ? styles.previewWordShine : ""
              } \${
                settings.particleSparkle ? styles.particleSparkleActive : ""
              }\`}
              style={{
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
              ) : (
                <span
                  style={{
                    background: previewDynamicSweepBg,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                  }}
                >
                  {lineActive}
                </span>
              )}
            </p>

            {/* Next Inactive Line */}
            <p
              className={styles.previewInactiveLine}
              style={{
                filter: \`blur(\${blurPx}px)\`,
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 800 : 600,
                color: previewInactiveColor,
              }}
            >
              {lineNext}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

`;
    modalContent = modalContent.substring(0, startIndex) + newStudioPane + modalContent.substring(endIndex);
    fs.writeFileSync(modalPath, modalContent.replace(/\n/g, '\r\n'), 'utf8');
    console.log("StudioLivePreviewPane cleaned up with pure lyrics!");
  } else {
    console.error("Could not find StudioLivePreviewPane block markers");
  }
}

// 3. Patch styles/SettingsModal.module.css
{
  const cssPath = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/styles/SettingsModal.module.css';
  let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

  // Replace modalOverlay blur
  css = css.replace(/backdrop-filter: blur\(6px\);/g, '/* removed nested blur */');
  css = css.replace(/-webkit-backdrop-filter: blur\(6px\);/g, '/* removed nested blur */');

  // Optimize modalHeader
  css = css.replace(
    /backdrop-filter: blur\(calc\(var\(--modal-backdrop-blur, 28px\) \* 0\.75\)\);/g,
    '/* removed redundant inner blur */'
  );
  css = css.replace(
    /-webkit-backdrop-filter: blur\(calc\(var\(--modal-backdrop-blur, 28px\) \* 0\.75\)\);/g,
    '/* removed redundant inner blur */'
  );

  // Ensure categoryNavHeader is sticky and pinned at top
  const oldNavHeader = `.categoryNavHeader {
  flex-shrink: 0;
  padding: 12px 20px 10px 20px;
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.82));
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  z-index: 15;
  box-sizing: border-box;`;

  const newNavHeader = `.categoryNavHeader {
  flex-shrink: 0;
  padding: 12px 20px 10px 20px;
  background: var(--modal-header-bg, rgba(18, 18, 22, 0.95));
  border-bottom: 1px solid var(--modal-border, rgba(255, 255, 255, 0.08));
  z-index: 30;
  box-sizing: border-box;
  position: sticky;
  top: 0;`;

  if (css.includes(oldNavHeader)) {
    css = css.replace(oldNavHeader, newNavHeader);
    console.log("categoryNavHeader made sticky & pinned!");
  }

  // Ensure modalWindow has isolation
  const oldModalWin = `.modalWindow {
  background: var(--modal-window-bg, rgba(18, 18, 22, 0.75));
  backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  border-radius: 16px;`;

  const newModalWin = `.modalWindow {
  background: var(--modal-window-bg, rgba(18, 18, 22, 0.75));
  backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--modal-backdrop-blur, 28px)) saturate(180%);
  border-radius: 16px;
  isolation: isolate;
  contain: paint;
  will-change: transform;`;

  if (css.includes(oldModalWin)) {
    css = css.replace(oldModalWin, newModalWin);
    console.log("modalWindow layer isolation added!");
  }

  fs.writeFileSync(cssPath, css.replace(/\n/g, '\r\n'), 'utf8');
  console.log("SettingsModal.module.css patched!");
}
