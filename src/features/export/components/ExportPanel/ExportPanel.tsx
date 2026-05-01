import { useTranslations } from 'next-intl';
import { parseTime, formatTime } from '../../lib/audio';
import { FREE_LIMIT, FREE_EXPORT_LIMIT } from '@/features/billing/constants';
import type { Song } from '@/features/playlist/types';
import type { ExportStatus } from '../../types';
import styles from './ExportPanel.module.css';

interface ExportPanelProps {
  songs: Song[];
  status: ExportStatus;
  progress: number;
  onExport: () => void;
  isPro: boolean;
  exportsUsed: number;
}

export function ExportPanel({ songs, status, progress, onExport, isPro, exportsUsed }: ExportPanelProps) {
  const t = useTranslations('export.panel');
  const totalSecs = songs.reduce((acc, s) => {
    const start = parseTime(s.startTime);
    const end = s.endTime ? parseTime(s.endTime) : s.duration;
    return acc + Math.max(0, end - start);
  }, 0);

  const isExporting = status.type === 'loading';
  const isDone = status.type === 'done';
  const isError = status.type === 'error';

  const overSongLimit = !isPro && songs.length > FREE_LIMIT;
  const quotaExhausted = !isPro && exportsUsed >= FREE_EXPORT_LIMIT;
  const blocked = overSongLimit || quotaExhausted;

  const exportsRemaining = Math.max(0, FREE_EXPORT_LIMIT - exportsUsed);
  const lockedCount = songs.length - FREE_LIMIT;

  return (
    <div className={styles.panel}>
      <div className={styles.info}>
        <span className={styles.count}>{t('trackCount', { count: songs.length })}</span>
        {totalSecs > 0 && <span className={styles.total}>~ {formatTime(totalSecs)}</span>}
        {overSongLimit && (
          <span className={styles.limitWarning}>
            {t('tracksLocked', { count: lockedCount })}
          </span>
        )}
        {!isPro && (
          <span className={quotaExhausted ? styles.quotaExhausted : styles.quotaRemaining}>
            {exportsRemaining} - {t('exportsLeft', { count: exportsRemaining })}
          </span>
        )}
      </div>

      <button
        className={`${styles.exportBtn} ${blocked ? styles.exportBtnUpgrade : ''}`}
        disabled={songs.length === 0 || isExporting}
        onClick={onExport}
      >
        {isExporting ? (
          <span className={styles.exporting}><Spinner />{status.message || t('processing')}</span>
        ) : overSongLimit ? (
          <><LockIcon />{t('lockedToExport', { count: songs.length })}</>
        ) : quotaExhausted ? (
          <><LockIcon />{t('limitReached')}</>
        ) : (
          <><DownloadIcon />{t('exportBtn')}</>
        )}
      </button>

      {isExporting && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      )}
      {isDone && <p className={styles.statusDone}>{status.message}</p>}
      {isError && <p className={styles.statusError}>✕ {status.message}</p>}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 11h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="5.5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M4 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="20 12"/>
    </svg>
  );
}
