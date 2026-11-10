const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/components/AppleMusicSettingsModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
if (!code.includes('ALL_LYRIC_SOURCES')) {
  code = code.replace(
    'import { GruvboxIcon, GruvboxIconName } from "@/components/icons/GruvboxIcon";',
    'import { GruvboxIcon, GruvboxIconName } from "@/components/icons/GruvboxIcon";\nimport { ALL_LYRIC_SOURCES, DEFAULT_LYRIC_SOURCES_PRIORITY, DEFAULT_KARAOKE_SOURCES_PRIORITY, LyricSourceId } from "@/lib/lyricsSources";'
  );
}

// 2. Update category type and sidebar
code = code.replace(
  'const [activeCategory, setActiveCategory] = useState<"all" | "appearance" | "lyrics" | "visuals" | "playback" | "performance">("all");',
  'const [activeCategory, setActiveCategory] = useState<"all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance">("all");'
);

code = code.replace(
  '{ id: "all" | "appearance" | "lyrics" | "visuals" | "playback" | "performance"; label: string; icon: GruvboxIconName }[]',
  '{ id: "all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance"; label: string; icon: GruvboxIconName }[]'
);

code = code.replace(
  '(cat: "all" | "appearance" | "lyrics" | "visuals" | "playback" | "performance") => {',
  '(cat: "all" | "appearance" | "lyrics" | "sources" | "visuals" | "playback" | "performance") => {'
);

if (!code.includes('{ id: "sources"')) {
  code = code.replace(
    '{ id: "lyrics", label: "Lyrics & Motion", icon: "chat" },',
    '{ id: "lyrics", label: "Lyrics & Motion", icon: "chat" },\n      { id: "sources", label: "Lyric Sources & Priority", icon: "focus" },'
  );
}

// 3. Add priority helpers inside component
if (!code.includes('const moveLyricSource')) {
  const helperTarget = 'const scrollToAnchor = useCallback((id: string) => {';
  const helperCode = `  const moveLyricSource = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentList = [...(settings.lyricSourcesPriority || DEFAULT_LYRIC_SOURCES_PRIORITY)];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;
    onUpdateSettings((prev) => ({
      ...prev,
      lyricSourcesPriority: currentList,
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.lyricSourcesPriority, onUpdateSettings]);

  const moveKaraokeSource = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentList = [...(settings.karaokeSourcesPriority || DEFAULT_KARAOKE_SOURCES_PRIORITY)];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;
    onUpdateSettings((prev) => ({
      ...prev,
      karaokeSourcesPriority: currentList,
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.karaokeSourcesPriority, onUpdateSettings]);

  const toggleSourceEnabled = useCallback((sourceId: LyricSourceId) => {
    const disabled = new Set(settings.disabledLyricSources || []);
    if (disabled.has(sourceId)) {
      disabled.delete(sourceId);
    } else {
      disabled.add(sourceId);
    }
    onUpdateSettings((prev) => ({
      ...prev,
      disabledLyricSources: Array.from(disabled),
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lyrics_sources_changed"));
    }
  }, [settings.disabledLyricSources, onUpdateSettings]);

  const scrollToAnchor = useCallback((id: string) => {`;

  code = code.replace(helperTarget, helperCode);
}

// 4. Insert Sources & Priorities Section
if (!code.includes('id="sec-sources"')) {
  const insertMarker = '{(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "visuals") && (';
  const sourcesSection = `{(activeCategory === "all" || searchQuery.trim() !== "" || activeCategory === "sources" || activeCategory === "lyrics") && (
            <>
              <div id="sec-sources" className={styles.sectionGroupHeader}>
                <span className={styles.sectionHeaderBadge}>
                  <GruvboxIcon name="focus" size={14} />
                </span>
                <span className={styles.sectionHeaderTitle}>Lyric Sources & Karaoke Priority</span>
                <div className={styles.sectionHeaderLine} />
              </div>

              {/* General Lyrics Source Priority Ladder */}
              <div style={{ marginBottom: "10px", padding: "0 4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--palette-primary, #1ed760)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Lyrics Search Fallback Priority
                </span>
                <p style={{ fontSize: "12px", opacity: 0.65, margin: "4px 0 12px 0" }}>
                  Nocturne queries these sources in top-to-bottom order. Use arrows to change priority order or toggle individual sources on/off.
                </p>
              </div>

              {(settings.lyricSourcesPriority || DEFAULT_LYRIC_SOURCES_PRIORITY).map((sourceId, idx, arr) => {
                const def = ALL_LYRIC_SOURCES.find((s) => s.id === sourceId);
                if (!def) return null;
                const isEnabled = !(settings.disabledLyricSources || []).includes(sourceId);

                return (
                  <div key={sourceId} className={styles.settingRow} style={{ opacity: isEnabled ? 1 : 0.55, transition: "opacity 0.2s ease" }}>
                    <div className={styles.leftCol} style={{ gap: "14px" }}>
                      <span className={\`\${styles.sourceRankBadge} \${!isEnabled ? styles.dimmed : ""}\`}>
                        #{idx + 1}
                      </span>
                      <div className={styles.textWrapper}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h3 className={styles.settingName}>{def.name}</h3>
                          <span className={styles.sourceCapabilityBadge}>
                            {def.badge}
                          </span>
                        </div>
                        <span className={styles.settingDesc}>{def.description}</span>
                      </div>
                    </div>

                    <div className={styles.rightCol} style={{ gap: "10px" }}>
                      <div className={styles.priorityButtonRow}>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveLyricSource(idx, "up")}
                          disabled={idx === 0}
                          title="Move up in priority"
                          aria-label={\`Move \${def.name} up in priority\`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveLyricSource(idx, "down")}
                          disabled={idx === arr.length - 1}
                          title="Move down in priority"
                          aria-label={\`Move \${def.name} down in priority\`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        className={\`\${styles.toggleSwitch} \${isEnabled ? styles.active : ""}\`}
                        onClick={() => toggleSourceEnabled(sourceId)}
                        aria-label={\`Toggle \${def.name}\`}
                      >
                        <div className={styles.toggleThumb} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Karaoke Word-by-Word Priority Order */}
              <div style={{ marginTop: "24px", marginBottom: "10px", padding: "0 4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--palette-primary, #1ed760)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Karaoke Word-by-Word Priority
                </span>
                <p style={{ fontSize: "12px", opacity: 0.65, margin: "4px 0 12px 0" }}>
                  When Karaoke Mode is active, Nocturne searches these sources first for word-level syllable timestamps before falling back to line sync.
                </p>
              </div>

              {(settings.karaokeSourcesPriority || DEFAULT_KARAOKE_SOURCES_PRIORITY).map((sourceId, idx, arr) => {
                const def = ALL_LYRIC_SOURCES.find((s) => s.id === sourceId);
                if (!def) return null;

                return (
                  <div key={\`k_\${sourceId}\`} className={\`\${styles.settingRow} \${styles.nested}\`}>
                    <div className={styles.leftCol} style={{ gap: "14px" }}>
                      <span className={styles.sourceRankBadge}>
                        #{idx + 1}
                      </span>
                      <div className={styles.textWrapper}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3 className={styles.settingName}>{def.name}</h3>
                          <span className={styles.sourceCapabilityBadge} style={{ borderColor: "var(--palette-primary)" }}>
                            Word-by-Word Syllables
                          </span>
                        </div>
                        <span className={styles.settingDesc}>
                          {def.id === "netease" ? "NetEase YRC word timestamps" : def.id === "spotify" ? "Spotify syllable-synced color lyrics" : def.id === "kugou" ? "Kugou KRC character-by-character timing" : "LRCLIB progressive sweep"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.rightCol}>
                      <div className={styles.priorityButtonRow}>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveKaraokeSource(idx, "up")}
                          disabled={idx === 0}
                          title="Move up in karaoke priority"
                          aria-label={\`Move \${def.name} up in karaoke priority\`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.priorityButton}
                          onClick={() => moveKaraokeSource(idx, "down")}
                          disabled={idx === arr.length - 1}
                          title="Move down in karaoke priority"
                          aria-label={\`Move \${def.name} down in karaoke priority\`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          ` + insertMarker;

  code = code.replace(insertMarker, sourcesSection);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated AppleMusicSettingsModal.tsx with Sources & Priorities');
