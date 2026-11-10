path = r'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\components\AppleMusicSettingsModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """      {/* Studio Stage */}
      <div className={styles.studioStage}>
        <div
          className={styles.previewAmbient}
          style={previewAmbientStyle}
        />
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
          <div className={styles.studioTrackPill}>
            {song?.image || songImage ? (
              <img
                src={song?.image || songImage}
                alt="Album"
                className={styles.studioTrackImg}
              />
            ) : (
              <div className={styles.studioTrackPlaceholder} />
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
      </div>"""

replacement = """      {/* Studio Stage */}
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
      </div>"""

if target in text:
    text = text.replace(target, replacement)
    print("Successfully updated StudioLivePreviewPane!")
else:
    print("Target not found, checking normalized...")
    norm_text = text.replace('\r\n', '\n')
    norm_target = target.replace('\r\n', '\n')
    if norm_target in norm_text:
        text = norm_text.replace(norm_target, replacement)
        print("Successfully updated with normalized line endings!")
    else:
        print("Target still not found!")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
