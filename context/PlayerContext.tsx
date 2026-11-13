import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrackItem, useQueue } from "./QueueContext";
import { LyricsSettings } from "@/typings/LyricsSettings";

interface PlayerContextType {
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  progress: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  isResolving: boolean;
  analyserNode: AnalyserNode | null;
  frequencyData: Uint8Array;
  playTrack: (track: TrackItem) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  playNextTrack: () => Promise<void>;
  playPrevTrack: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 1,
  isResolving: false,
  analyserNode: null,
  frequencyData: new Uint8Array(64),
  playTrack: async () => {},
  togglePlay: async () => {},
  seek: () => {},
  setVolume: () => {},
  playNextTrack: async () => {},
  playPrevTrack: async () => {},
});

export const PlayerProvider: React.FC<{
  settings: LyricsSettings;
  children: React.ReactNode;
}> = ({ settings, children }) => {
  const { currentTrack: queueTrack, playNext, playPrev } = useQueue();
  const [currentTrack, setCurrentTrack] = useState<TrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(64));
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Audio graph
  const initAudioGraph = useCallback(() => {
    if (audioContextRef.current || !audioRef.current || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      mediaSourceRef.current = source;
    } catch (e) {
      console.warn("Could not initialize Web Audio Graph:", e);
    }
  }, []);

  // Update visualizer frequency data
  useEffect(() => {
    const updateSpectrum = () => {
      if (analyserRef.current && currentTrack?.source !== "spotify") {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setFrequencyData(data);
      } else if (isPlaying && currentTrack?.source === "spotify") {
        // Procedural simulation for Spotify stream
        const sim = new Uint8Array(64);
        const t = Date.now() / 150;
        for (let i = 0; i < 64; i++) {
          sim[i] = Math.max(10, Math.min(240, Math.floor(128 + 100 * Math.sin(t + i * 0.3))));
        }
        setFrequencyData(sim);
      } else {
        setFrequencyData(new Uint8Array(64));
      }
      animFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    animFrameRef.current = requestAnimationFrame(updateSpectrum);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTrack]);

  // Audio element setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      const next = playNext();
      if (next) {
        playTrack(next);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [playNext]);

  const playTrack = async (track: TrackItem) => {
    setCurrentTrack(track);
    setProgress(0);
    setIsResolving(true);

    try {
      if (track.source === "spotify") {
        // Soloist bridge
        if (audioRef.current) {
          audioRef.current.pause();
        }
        await invoke("send_soloist_command", {
          action: "play",
          port: settings.soloistPort || 8000,
        });
        setIsPlaying(true);
        setDuration(track.duration || 180);
      } else if (track.source === "local") {
        // Local file audio playback
        if (!audioRef.current) return;
        initAudioGraph();
        if (audioContextRef.current?.state === "suspended") {
          await audioContextRef.current.resume();
        }
        // Use local asset URL or convert path
        const fileUrl = track.url || (track.localPath ? `file://${track.localPath}` : "");
        audioRef.current.src = fileUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        // YouTube audio playback via Python server
        if (!audioRef.current) return;
        initAudioGraph();
        if (audioContextRef.current?.state === "suspended") {
          await audioContextRef.current.resume();
        }

        let streamUrl = track.url;
        if (!streamUrl) {
          const res = await fetch(
            `http://127.0.0.1:8000/resolve?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(
              track.artist
            )}`
          );
          const data = await res.json();
          streamUrl = data.url;
          if (data.title) track.title = data.title;
          if (data.artist) track.artist = data.artist;
        }

        if (streamUrl) {
          audioRef.current.src = streamUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    } finally {
      setIsResolving(false);
    }
  };

  const togglePlay = async () => {
    if (!currentTrack) return;

    if (currentTrack.source === "spotify") {
      const nextAction = isPlaying ? "pause" : "play";
      await invoke("send_soloist_command", {
        action: nextAction,
        port: settings.soloistPort || 8000,
      });
      setIsPlaying(!isPlaying);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const seek = (seconds: number) => {
    if (currentTrack?.source !== "spotify" && audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
    setProgress(seconds);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const playNextTrack = async () => {
    const next = playNext();
    if (next) {
      await playTrack(next);
    }
  };

  const playPrevTrack = async () => {
    const prev = playPrev();
    if (prev) {
      await playTrack(prev);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isResolving,
        analyserNode: analyserRef.current,
        frequencyData,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        playNextTrack,
        playPrevTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
