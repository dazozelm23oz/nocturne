import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LyricsSettings } from "@/typings/LyricsSettings";

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverArt?: string;
  source: "spotify" | "youtube" | "local";
  url?: string;
  localPath?: string;
}

interface QueueContextType {
  queue: TrackItem[];
  currentIndex: number;
  currentTrack: TrackItem | null;
  addToQueue: (track: TrackItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueue: (tracks: TrackItem[], startIndex?: number) => void;
  playNext: () => TrackItem | null;
  playPrev: () => TrackItem | null;
  jumpToIndex: (index: number) => TrackItem | null;
}

const QueueContext = createContext<QueueContextType>({
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  setQueue: () => {},
  playNext: () => null,
  playPrev: () => null,
  jumpToIndex: () => null,
});

export const QueueProvider: React.FC<{
  settings: LyricsSettings;
  children: React.ReactNode;
}> = ({ settings, children }) => {
  const [queue, setQueueState] = useState<TrackItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Prefetch next N tracks using Python server
  const prefetchUpcomingTracks = useCallback(
    async (startIndex: number) => {
      const count = settings.prefetchCount || 2;
      const upcoming = queue.slice(startIndex + 1, startIndex + 1 + count);
      for (const track of upcoming) {
        if (track.source === "youtube") {
          try {
            fetch(
              `http://127.0.0.1:8000/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(
                track.artist
              )}`
            ).catch(() => {});
          } catch (e) {
            // Non-blocking prefetch
          }
        }
      }
    },
    [queue, settings.prefetchCount]
  );

  useEffect(() => {
    if (currentIndex >= 0 && queue.length > 0) {
      prefetchUpcomingTracks(currentIndex);
    }
  }, [currentIndex, queue, prefetchUpcomingTracks]);

  const addToQueue = (track: TrackItem) => {
    setQueueState((prev) => [...prev, track]);
    if (currentIndex === -1) {
      setCurrentIndex(0);
    }
  };

  const removeFromQueue = (index: number) => {
    setQueueState((prev) => prev.filter((_, i) => i !== index));
    if (index === currentIndex) {
      // current track removed
    } else if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueueState([]);
    setCurrentIndex(-1);
  };

  const setQueue = (tracks: TrackItem[], startIndex = 0) => {
    setQueueState(tracks);
    setCurrentIndex(tracks.length > 0 ? Math.max(0, Math.min(startIndex, tracks.length - 1)) : -1);
  };

  const playNext = (): TrackItem | null => {
    if (currentIndex + 1 < queue.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      return queue[nextIdx];
    }
    return null;
  };

  const playPrev = (): TrackItem | null => {
    if (currentIndex - 1 >= 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      return queue[prevIdx];
    }
    return null;
  };

  const jumpToIndex = (index: number): TrackItem | null => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
      return queue[index];
    }
    return null;
  };

  return (
    <QueueContext.Provider
      value={{
        queue,
        currentIndex,
        currentTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setQueue,
        playNext,
        playPrev,
        jumpToIndex,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);
