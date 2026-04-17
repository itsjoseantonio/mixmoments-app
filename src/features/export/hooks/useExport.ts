import { useState, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { processAndEncode } from '../lib/audio';
import { FREE_LIMIT, FREE_EXPORT_LIMIT } from '@/features/billing/constants';
import { getExportCount, incrementExportCount } from '@/features/billing/lib/exportQuota';
import type { Song } from '@/features/playlist/types';
import type { ExportStatus } from '../types';

export function useExport(
  songs: Song[],
  audioBuffers: MutableRefObject<Record<string, ArrayBuffer>>,
  isPro: boolean,
  onUpgradeRequired: () => void,
) {
  const [status, setStatus] = useState<ExportStatus>({ type: 'idle', message: '' });
  const [progress, setProgress] = useState(0);
  const [exportsUsed, setExportsUsed] = useState(() => getExportCount());

  const exportPlaylist = async () => {
    if (!songs.length) return;

    if (!isPro && songs.length > FREE_LIMIT) {
      onUpgradeRequired();
      return;
    }

    if (!isPro && exportsUsed >= FREE_EXPORT_LIMIT) {
      onUpgradeRequired();
      return;
    }

    setStatus({ type: 'loading', message: 'Decoding audio…' });
    setProgress(0);

    try {
      const decoded: AudioBuffer[] = [];
      for (let i = 0; i < songs.length; i++) {
        setStatus({ type: 'loading', message: `Decoding: ${songs[i].name}` });
        const ctx = new OfflineAudioContext(2, 2, 44100);
        const buf = await ctx.decodeAudioData(audioBuffers.current[songs[i].id].slice(0));
        decoded.push(buf);
        setProgress(Math.round(((i + 1) / songs.length) * 18));
      }

      setStatus({ type: 'loading', message: 'Mixing tracks…' });

      const blob = await processAndEncode(
        songs,
        decoded,
        setProgress,
        (msg) => setStatus({ type: 'loading', message: msg }),
      );

      setProgress(99);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mixmoments-playlist.mp3';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      incrementExportCount();
      setExportsUsed(getExportCount());

      setProgress(100);
      setStatus({ type: 'done', message: `Done — ${(blob.size / 1024 / 1024).toFixed(1)} MB downloaded` });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    }
  };

  const notifyPaymentReturn = useCallback((type: 'success' | 'cancelled') => {
    if (type === 'success') {
      setStatus({ type: 'done', message: '🎉 Payment successful! Unlimited exports unlocked.' });
    } else {
      setStatus({ type: 'idle', message: '' });
    }
  }, []);

  return { status, progress, exportPlaylist, notifyPaymentReturn, exportsUsed };
}
