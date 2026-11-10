const fs = require('fs');
const path = 'C:/Users/Ziad/.gemini/antigravity/scratch/lirics/pages/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add idle state inside Home()
if (!code.includes('isControlsIdle')) {
  const target = 'const [isHoveringScroller, setIsHoveringScroller] = useState<boolean>(false);';
  const addition = `const [isHoveringScroller, setIsHoveringScroller] = useState<boolean>(false);

  // Apple TV Cinema Mode: Auto-hide controls when mouse is idle
  const [isControlsIdle, setIsControlsIdle] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsControlsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsIdle(true);
    }, 3500);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    resetIdleTimer();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);`;
  code = code.replace(target, addition);
}

// 2. Add NOW PLAYING kicker above trackTitle
if (!code.includes('styles.nowPlayingKicker')) {
  const titleTarget = '<div className={styles.titleArtistCol}>\n                    <div className={styles.titleRow}>';
  const titleReplacement = '<div className={styles.titleArtistCol}>\n                    <div className={styles.nowPlayingKicker}>NOW PLAYING</div>\n                    <div className={styles.titleRow}>';
  
  if (code.includes(titleTarget)) {
    code = code.replace(titleTarget, titleReplacement);
  } else {
    // regex fallback
    code = code.replace(
      /<div className=\{styles\.titleArtistCol\}>\s*<div className=\{styles\.titleRow\}>/,
      '<div className={styles.titleArtistCol}>\n                    <div className={styles.nowPlayingKicker}>NOW PLAYING</div>\n                    <div className={styles.titleRow}>'
    );
  }
}

// 3. Wrap Scrubber & Controls Row in collapsibleControls
if (!code.includes('styles.collapsibleControls')) {
  const scrubberMarker = '{/* Scrubber / Progress Bar */}';
  const controlsEndMarker = '                  </div>\n                </div>\n              </div>\n\n              {/* Right Panel: Apple Music Karaoke Lyrics */}';

  const wrapStart = `<div
                    className={\`\${styles.collapsibleControls} \${
                      isControlsIdle && settings.cinemaMode && !showMenu ? styles.controlsHidden : ""
                    }\`}
                    onMouseEnter={() => setIsControlsIdle(false)}
                  >
                    {/* Scrubber / Progress Bar */}`;

  code = code.replace(scrubberMarker, wrapStart);

  // Close collapsibleControls right after controlsRow closing </div>
  const controlsRowEnd = '                    </button>\n                  </div>';
  code = code.replace(
    controlsRowEnd,
    '                    </button>\n                  </div>\n                  </div>'
  );
}

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated pages/index.tsx');
