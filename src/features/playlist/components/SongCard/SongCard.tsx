import { useRef, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatTime, parseTime } from '@/features/export/lib/audio';
import { WaveformTrimmer } from '../WaveformTrimmer/WaveformTrimmer';
import type { Song } from '../../types';
import styles from './SongCard.module.css';

interface SongCardProps {
  song: Song;
  index: number;
  total: number;
  onChange: (id: string, field: string, value: string | number) => void;
  onRemove: (id: string) => void;
  locked: boolean;
  isPlaying: boolean;
  onPlay: (id: string | null) => void;
}

export function SongCard({
  song, index, total, onChange, onRemove, locked, isPlaying, onPlay,
}: SongCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id });

  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef('');
  const songRef = useRef(song);
  // eslint-disable-next-line react-hooks/refs
  songRef.current = song;

  const [currentTime, setCurrentTime] = useState(0);

  // Revoke blob URL on unmount and reset the ref so a remount (StrictMode) gets a fresh URL
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = '';
      }
    };
  }, []);

  // Play / pause driven by parent state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      // Lazy: create the blob URL only the first time this card is played
      if (!blobUrlRef.current) {
        blobUrlRef.current = URL.createObjectURL(songRef.current.file);
        audio.src = blobUrlRef.current;
      }
      audio.currentTime = parseTime(songRef.current.startTime);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    const { endTime, duration, startTime } = songRef.current;
    const endSec = endTime ? parseTime(endTime) : duration;
    if (endSec > 0 && audio.currentTime >= endSec) {
      audio.pause();
      audio.currentTime = parseTime(startTime);
      setCurrentTime(parseTime(startTime));
      onPlay(null);
    }
  };

  const handleEnded = () => onPlay(null);
  const togglePlay = () => onPlay(isPlaying ? null : song.id);

  const startSec = parseTime(song.startTime);
  const endSec = song.endTime ? parseTime(song.endTime) : song.duration;
  const trimDuration = Math.max(0, endSec - startSec);
  const elapsed = Math.max(0, currentTime - startSec);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const isLast = index === total - 1;

  return (
    <div ref={setNodeRef} style={style} className={`${styles.card} ${locked ? styles.locked : ''}`}>
      {locked && (
        <button className={styles.lockedBadge} onClick={() => {}}>locked</button>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="none"
      />

      <div className={styles.header}>
        <button className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder" disabled={locked}>
          <GripIcon />
        </button>
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.name} title={song.name}>{song.name}</span>
        {song.duration > 0 && (
          <span className={styles.duration}>{formatTime(song.duration)}</span>
        )}
        <button className={styles.removeBtn} style={{ pointerEvents: locked ? 'auto' : 'auto' }} onClick={() => onRemove(song.id)} title="Remove">
          <RemoveIcon />
        </button>
      </div>

      <div className={styles.player}>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.playBtnActive : ''}`}
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <WaveformTrimmer
          file={song.file}
          duration={song.duration}
          startTime={song.startTime}
          endTime={song.endTime}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onChange={(field, value) => onChange(song.id, field, value)}
        />
        <span className={styles.playerTime}>
          {formatTime(elapsed)} / {formatTime(trimDuration || song.duration)}
        </span>
      </div>

      <div className={styles.controls}>
        <div className={styles.ctrlGroup}>
          <label className={styles.ctrlLabel}>start</label>
          <div className={styles.timeInput}>
            <input
              type="text"
              value={song.startTime}
              placeholder="0:00"
              onChange={e => onChange(song.id, 'startTime', e.target.value)}
            />
            <span className={styles.timeHint}>m:ss</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.ctrlGroup}>
          <label className={styles.ctrlLabel}>end</label>
          <div className={styles.timeInput}>
            <input
              type="text"
              value={song.endTime}
              placeholder={song.duration > 0 ? formatTime(song.duration) : 'end'}
              onChange={e => onChange(song.id, 'endTime', e.target.value)}
            />
            <span className={styles.timeHint}>m:ss</span>
          </div>
        </div>

        {!isLast && (
          <>
            <div className={styles.divider} />
            <div className={styles.ctrlGroup}>
              <label className={styles.ctrlLabel}>fade out</label>
              <select
                value={song.fadeOut}
                onChange={e => onChange(song.id, 'fadeOut', Number(e.target.value))}
                className={styles.select}
              >
                <option value={0}>none</option>
                <option value={1}>1s</option>
                <option value={2}>2s</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={8}>8s</option>
              </select>
            </div>
          </>
        )}
      </div>

      {!isLast && (
        <div className={styles.connector}>
          <div className={styles.connectorLine} />
          <span className={styles.connectorLabel}>
            {song.fadeOut > 0 ? `${song.fadeOut}s fade →` : 'cut →'}
          </span>
          <div className={styles.connectorLine} />
        </div>
      )}
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="4" cy="4" r="1.2" fill="currentColor" />
      <circle cx="10" cy="4" r="1.2" fill="currentColor" />
      <circle cx="4" cy="8" r="1.2" fill="currentColor" />
      <circle cx="10" cy="8" r="1.2" fill="currentColor" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M3 2l8 4.5L3 11V2z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="2" width="3.5" height="9" rx="1" fill="currentColor" />
      <rect x="7.5" y="2" width="3.5" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}
