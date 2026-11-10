const fs = require('fs');

// 1. Update providers/SongContext.tsx
let songCtx = fs.readFileSync('providers/SongContext.tsx', 'utf8');

songCtx = songCtx.replace(
  '  seekTo: (targetSeconds: number) => Promise<void>;',
  '  seekTo: (targetSeconds: number) => Promise<void>;\n  togglePlayPause: (pause: boolean) => void;'
);
songCtx = songCtx.replace(
  '  seekTo: (targetSeconds: number) => Promise<void>;\r\n',
  '  seekTo: (targetSeconds: number) => Promise<void>;\r\n  togglePlayPause: (pause: boolean) => void;\r\n'
);

songCtx = songCtx.replace(
  '  seekTo: async () => {},',
  '  seekTo: async () => {},\n  togglePlayPause: () => {},'
);
songCtx = songCtx.replace(
  '  seekTo: async () => {},\r\n',
  '  seekTo: async () => {},\r\n  togglePlayPause: () => {},\r\n'
);

const oldSeekTo = `  const seekTo = useCallback(async (targetSeconds: number) => {`;
const newSeekTo = `  const togglePlayPauseOptimistic = useCallback((pause: boolean) => {
    const nextPlaying = !pause;
    setData((prev: any) =>
      prev ? { ...prev, is_playing: nextPlaying } : { is_playing: nextPlaying }
    );
  }, []);

  const seekTo = useCallback(async (targetSeconds: number) => {`;

songCtx = songCtx.replace(oldSeekTo, newSeekTo);

songCtx = songCtx.replace(
  '          seekTo,\n          queue,',
  '          seekTo,\n          togglePlayPause: togglePlayPauseOptimistic,\n          queue,'
);
songCtx = songCtx.replace(
  '          seekTo,\r\n          queue,',
  '          seekTo,\r\n          togglePlayPause: togglePlayPauseOptimistic,\r\n          queue,'
);

fs.writeFileSync('providers/SongContext.tsx', songCtx, 'utf8');

// 2. Update pages/index.tsx
let indexCode = fs.readFileSync('pages/index.tsx', 'utf8');
indexCode = indexCode.replace(
  '  const { skipNext, skipPrev, seekTo } = useOptimisticPlayback();',
  '  const { skipNext, skipPrev, seekTo, togglePlayPause } = useOptimisticPlayback();'
);
indexCode = indexCode.replace(
  '  const { skipNext, skipPrev, seekTo } = useOptimisticPlayback();\r\n',
  '  const { skipNext, skipPrev, seekTo, togglePlayPause } = useOptimisticPlayback();\r\n'
);

indexCode = indexCode.replace(
  `    const nextPlaying = !pause;
    setData((prev: any) =>
      prev
        ? { ...prev, is_playing: nextPlaying }
        : { is_playing: nextPlaying }
    );`,
  `    togglePlayPause(pause);`
);
indexCode = indexCode.replace(
  `    const nextPlaying = !pause;\r\n    setData((prev: any) =>\r\n      prev\r\n        ? { ...prev, is_playing: nextPlaying }\r\n        : { is_playing: nextPlaying }\r\n    );`,
  `    togglePlayPause(pause);`
);

fs.writeFileSync('pages/index.tsx', indexCode, 'utf8');

console.log('Optimistic toggle wired into SongContext & index.tsx');
