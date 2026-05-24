'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { parseTime } from '@/features/export/lib/audio';
import type { Song } from '@/features/playlist/types';

export type PlayerState = 'idle' | 'playing' | 'paused';

export interface PreviewPlayerHandle {
  state: PlayerState;
  currentTrackIndex: number;
  currentTime: number;
  totalDuration: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  seek: (time: number) => void;
}

function songStartSec(s: Song): number { return parseTime(s.startTime); }
function songEndSec(s: Song): number { return s.endTime ? parseTime(s.endTime) : s.duration; }
function songDur(s: Song): number { return Math.max(0, songEndSec(s) - songStartSec(s)); }

function computeMixBase(songs: Song[], idx: number): number {
  let acc = 0;
  for (let i = 0; i < idx; i++) acc += songDur(songs[i]);
  return acc;
}

function findTrackAt(songs: Song[], mixTime: number): { idx: number; within: number } {
  let acc = 0;
  for (let i = 0; i < songs.length; i++) {
    const d = songDur(songs[i]);
    if (i === songs.length - 1 || mixTime < acc + d) {
      return { idx: i, within: Math.max(0, Math.min(mixTime - acc, d)) };
    }
    acc += d;
  }
  return { idx: 0, within: 0 };
}

export function usePreviewPlayer(
  songs: Song[],
  audioBuffers: MutableRefObject<Record<string, ArrayBuffer>>,
): PreviewPlayerHandle {
  const [state, setState] = useState<PlayerState>('idle');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const stateRef = useRef<PlayerState>('idle');
  const songsRef = useRef(songs);
  const totalDurRef = useRef(0);
  const decodedRef = useRef(new Map<string, AudioBuffer>());

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef(0);
  const launchIdRef = useRef(0);

  const trackIdxRef = useRef(0);
  const withinRef = useRef(0);     // seconds into track when source started
  const ctxStartRef = useRef(0);  // audioCtx.currentTime when source started

  const totalDuration = useMemo(() => songs.reduce((a, s) => a + songDur(s), 0), [songs]);

  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { totalDurRef.current = totalDuration; }, [totalDuration]);

  const setStateSynced = useCallback((s: PlayerState) => {
    stateRef.current = s;
    setState(s);
  }, []); // setState is stable per React contract

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const cleanupAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      try { sourceRef.current.stop(); } catch { /* already stopped */ }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    gainRef.current?.disconnect();
    gainRef.current = null;
  }, []);

  const getLiveWithin = useCallback((): number => {
    if (stateRef.current === 'playing') {
      return withinRef.current + (ctxRef.current?.currentTime ?? 0) - ctxStartRef.current;
    }
    return withinRef.current;
  }, []);

  // Ref so the function can call itself recursively without a self-referencing useCallback
  const launchRef = useRef<(trackIdx: number, within: number) => Promise<void>>(async () => {});

  const launch = useCallback(async (trackIdx: number, within: number): Promise<void> => {
    const launchId = ++launchIdRef.current;
    const songs = songsRef.current;
    const song = songs[trackIdx];
    if (!song) return;

    let buf = decodedRef.current.get(song.id) ?? null;
    if (!buf) {
      const raw = audioBuffers.current[song.id];
      if (!raw) return;
      const ctx = getCtx();
      try {
        buf = await ctx.decodeAudioData(raw.slice(0));
      } catch { return; }
      if (launchIdRef.current !== launchId) return; // superseded by newer call
      decodedRef.current.set(song.id, buf);
    }
    if (launchIdRef.current !== launchId) return;

    const ctx = getCtx();
    cleanupAudio();

    const start = songStartSec(song);
    const dur = songDur(song);
    const remaining = dur - within;

    if (remaining <= 0.05) {
      const next = trackIdx + 1;
      if (next < songs.length) {
        await launchRef.current(next, 0);
      } else {
        setStateSynced('idle');
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        trackIdxRef.current = 0;
        withinRef.current = 0;
      }
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, ctx.currentTime);

    const fade = song.fadeOut ?? 0;
    if (fade > 0 && remaining > fade) {
      gain.gain.setValueAtTime(1, ctx.currentTime + remaining - fade);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + remaining);
    }

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0, start + within, remaining);

    sourceRef.current = source;
    gainRef.current = gain;
    ctxStartRef.current = ctx.currentTime;
    withinRef.current = within;
    trackIdxRef.current = trackIdx;

    setStateSynced('playing');
    setCurrentTrackIndex(trackIdx);

    const base = computeMixBase(songs, trackIdx);
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      if (stateRef.current !== 'playing') return;
      const elapsed = (ctxRef.current?.currentTime ?? 0) - ctxStartRef.current;
      setCurrentTime(Math.min(base + within + elapsed, totalDurRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    source.onended = async () => {
      if (stateRef.current !== 'playing') return;
      cancelAnimationFrame(rafRef.current);
      const next = trackIdx + 1;
      const currentSongs = songsRef.current;
      if (next < currentSongs.length) {
        await launchRef.current(next, 0);
      } else {
        setStateSynced('idle');
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        trackIdxRef.current = 0;
        withinRef.current = 0;
      }
    };
  }, [audioBuffers, cleanupAudio, getCtx, setStateSynced]); // all stable

  // Keep launchRef pointing to the memoized launch so onended always calls the latest.
  // useEffect (not render) to satisfy react-hooks/refs. launch is stable so this runs once.
  useEffect(() => { launchRef.current = launch; }, [launch]);

  // Reset when tracks are added, removed, or reordered (not when trim values change)
  const songIdsKey = useMemo(() => songs.map(s => s.id).join(','), [songs]);
  const prevSongIdsKey = useRef('');
  useEffect(() => {
    if (songIdsKey === prevSongIdsKey.current) return;
    prevSongIdsKey.current = songIdsKey;
    if (stateRef.current === 'idle') return;
    cleanupAudio();
    stateRef.current = 'idle';
    setState('idle');
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    trackIdxRef.current = 0;
    withinRef.current = 0;
  }, [songIdsKey, cleanupAudio]);

  const play = useCallback(() => {
    if (stateRef.current === 'playing') return;
    void launch(trackIdxRef.current, withinRef.current);
  }, [launch]);

  const pause = useCallback(() => {
    if (stateRef.current !== 'playing') return;
    withinRef.current = getLiveWithin();
    cleanupAudio();
    setStateSynced('paused');
  }, [cleanupAudio, getLiveWithin, setStateSynced]);

  const stop = useCallback(() => {
    cleanupAudio();
    setStateSynced('idle');
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    trackIdxRef.current = 0;
    withinRef.current = 0;
  }, [cleanupAudio, setStateSynced]);

  const skipNext = useCallback(() => {
    if (stateRef.current === 'idle') return;
    const songs = songsRef.current;
    const next = trackIdxRef.current + 1;
    if (next >= songs.length) return;
    withinRef.current = 0;
    trackIdxRef.current = next;
    if (stateRef.current === 'playing') {
      void launch(next, 0);
    } else {
      setCurrentTrackIndex(next);
      setCurrentTime(computeMixBase(songs, next));
    }
  }, [launch]);

  const skipPrev = useCallback(() => {
    if (stateRef.current === 'idle') return;
    const songs = songsRef.current;
    const liveWithin = getLiveWithin();
    const targetIdx = liveWithin > 3
      ? trackIdxRef.current
      : Math.max(0, trackIdxRef.current - 1);
    withinRef.current = 0;
    trackIdxRef.current = targetIdx;
    if (stateRef.current === 'playing') {
      void launch(targetIdx, 0);
    } else {
      setCurrentTrackIndex(targetIdx);
      setCurrentTime(computeMixBase(songs, targetIdx));
    }
  }, [launch, getLiveWithin]);

  const seek = useCallback((mixTime: number) => {
    const songs = songsRef.current;
    if (!songs.length) return;
    const clamped = Math.max(0, Math.min(mixTime, totalDurRef.current));
    const { idx, within } = findTrackAt(songs, clamped);
    withinRef.current = within;
    trackIdxRef.current = idx;
    if (stateRef.current === 'playing') {
      void launch(idx, within);
    } else {
      setCurrentTrackIndex(idx);
      setCurrentTime(clamped);
    }
  }, [launch]);

  return { state, currentTrackIndex, currentTime, totalDuration, play, pause, stop, skipNext, skipPrev, seek };
}
