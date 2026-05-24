'use client';
import { useRef } from 'react';
import { formatTime } from '@/features/export/lib/audio';
import type { PreviewPlayerHandle } from '../../hooks/usePreviewPlayer';
import type { Song } from '@/features/playlist/types';
import styles from './PreviewPlayer.module.css';

interface Props {
  player: PreviewPlayerHandle;
  songs: Song[];
}

export function PreviewPlayer({ player, songs }: Props) {
  const { state, currentTrackIndex, currentTime, totalDuration, play, pause, stop, skipNext, skipPrev, seek } = player;

  // Must be before any early return (rules of hooks)
  const trackRef = useRef<HTMLDivElement>(null);

  if (songs.length === 0) return null;

  const isPlaying = state === 'playing';
  const isActive = state !== 'idle';
  const song = songs[currentTrackIndex];
  const trackNum = String(currentTrackIndex + 1).padStart(2, '0');
  const trackLabel = `${trackNum} — ${song?.name ?? ''}`;
  const pct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const canNext = isActive && currentTrackIndex < songs.length - 1;
  const canPrev = isActive && (currentTrackIndex > 0 || currentTime > 3);

  const getSeekTime = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * totalDuration;
  };

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    seek(getSeekTime(e.clientX));
    const onMove = (ev: MouseEvent) => seek(getSeekTime(ev.clientX));
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${styles.hideMobile}`}
          onClick={skipPrev}
          disabled={!canPrev}
          title="Previous"
        >
          <SkipPrevIcon />
        </button>

        <button
          className={`${styles.btn} ${styles.playBtn}`}
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          className={`${styles.btn} ${styles.hideMobile}`}
          onClick={skipNext}
          disabled={!canNext}
          title="Next"
        >
          <SkipNextIcon />
        </button>

        <button
          className={`${styles.btn} ${styles.hideMobile}`}
          onClick={stop}
          disabled={!isActive}
          title="Stop"
        >
          <StopIcon />
        </button>
      </div>

      <div className={styles.trackInfo} title={trackLabel}>
        {isPlaying && <span className={styles.playingDot} aria-hidden="true" />}
        <span className={styles.trackLabel}>{trackLabel}</span>
      </div>

      <div className={styles.progressArea}>
        <div
          ref={trackRef}
          className={styles.progressTrack}
          onMouseDown={handleTrackMouseDown}
          role="slider"
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(totalDuration)}
          aria-valuenow={Math.round(currentTime)}
        >
          <div className={styles.progressRail} />
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          {isActive && <div className={styles.thumb} style={{ left: `${pct}%` }} />}
        </div>
        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1.5" width="4" height="11" rx="1.2" fill="currentColor" />
      <rect x="8" y="1.5" width="4" height="11" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function SkipPrevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="2" width="2" height="10" rx="1" fill="currentColor" />
      <path d="M12 2L5 7l7 5V2z" fill="currentColor" />
    </svg>
  );
}

function SkipNextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l7 5-7 5V2z" fill="currentColor" />
      <rect x="10" y="2" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}
