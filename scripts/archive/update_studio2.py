path = r'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\components\AppleMusicSettingsModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = "{/* Studio Stage */}"
end_marker = "{/* Studio Bottom Bar */}"

s_idx = text.find(start_marker)
e_idx = text.find(end_marker)

print("Found markers:", s_idx, e_idx)

replacement = """{/* Studio Stage */}
      <div className={styles.studioStage} style={{ position: "relative", overflow: "hidden" }}>
        <div
          className={styles.previewAmbient}
          style={previewAmbientStyle}
        />
        {(settings.auroraMeshOrbs || settings.background === "3D Fluid Aurora") && (
          <AuroraMeshOrbs
            palette={previewPalette}
            isPlaying={isSimulatingSweep}
            isLightMode={isLightMode}
          />
        )}
        <div
          className={styles.previewOverlay}
          style={{
            background: previewOverlayBg,
          }}
        />

        <div
          className={`${styles.studioElasticWrap} ${
            isTestBouncing ? styles.elasticBounce : ""
          }`}
          style={{
            transform: `translateY(${testPullOffset}px)`,
          }}
        >
          {/* Track Info Pill */}
          <div
            className={styles.studioTrackPill}
            style={
              settings.albumEdgeGlow
                ? {
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 18px ${previewLyricActiveColor}88`,
                  }
                : undefined
            }
          >
            {song?.image || songImage ? (
              <img
                src={song?.image || songImage}
                alt="Album"
                className={styles.studioTrackImg}
                style={
                  settings.vinylMode
                    ? {
                        borderRadius: "50%",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                      }
                    : undefined
                }
              />
            ) : (
              <div
                className={styles.studioTrackPlaceholder}
                style={
                  settings.vinylMode
                    ? {
                        borderRadius: "50%",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                      }
                    : undefined
                }
              />
            )}
            <div className={styles.studioTrackMeta}>
              <span className={styles.studioTrackTitle}>
                {song?.name || "Stan (feat. Dido)"}
              </span>
              <span className={styles.studioTrackArtist}>
                {song?.artists || "Eminem, Dido"}
              </span>
            </div>
          </div>

          {/* Lyrics Presentation */}
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
                filter: `blur(${blurPx}px)`,
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

            {/* Active Singing Line */}
            <p
              className={`${styles.previewActiveLine} ${
                settings.wordShine ? styles.previewWordShine : ""
              }`}
              style={{
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 900 : 750,
                fontSize: previewActiveSize,
                transform: `scale(${previewScale})`,
                background: previewDynamicSweepBg,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow:
                  !isLightMode && previewPalette?.glow
                    ? `0 0 16px ${previewPalette.glow}`
                    : undefined,
                ...previewFloatStyle,
              }}
            >
              {lineActive}
            </p>

            {/* Next Inactive Line */}
            <p
              className={styles.previewInactiveLine}
              style={{
                filter: `blur(${blurPx}px)`,
                fontFamily: previewFont,
                fontWeight: settings.boldText ? 800 : 600,
                color: previewInactiveColor,
              }}
            >
              {lineNext}
            </p>
          </div>
        </div>

        {/* Studio Spectrum Visualizer */}
        {settings.spectrumVisualizer && (
          <AudioSpectrumVisualizer
            isPlaying={isSimulatingSweep}
            primaryColor={previewLyricActiveColor}
            glowColor={previewPalette?.glow}
            isLightMode={isLightMode}
          />
        )}
      </div>

      """

new_text = text[:s_idx] + replacement + text[e_idx:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Updated StudioLivePreviewPane successfully!")
