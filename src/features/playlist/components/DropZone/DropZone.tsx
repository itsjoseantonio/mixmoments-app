import { useRef, useState } from 'react';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      f => f.type.startsWith('audio/') || f.name.toLowerCase().endsWith('.mp3'),
    );
    if (valid.length > 0) onFiles(valid);
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".mp3,audio/*"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      <div className={styles.iconWrap}>
        <MusicIcon />
      </div>
      <p className={styles.label}>Drop your MP3 files here</p>
      <p className={styles.sub}>or click to browse · any event, any occasion · files stay in your browser</p>
    </div>
  );
}

function MusicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M10 20V8l14-3v12" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="8" cy="20" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="22" cy="17" r="3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
