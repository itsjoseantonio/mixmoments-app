import type { Song } from '@/features/playlist/types';

export function formatTime(secs: number): string {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function parseTime(str: string | number): number {
  if (!str && str !== 0) return 0;
  const s = String(str).trim();
  const parts = s.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

async function resampleTo44100(buf: AudioBuffer): Promise<AudioBuffer> {
  if (buf.sampleRate === 44100) return buf;
  const targetLen = Math.round(buf.duration * 44100);
  const offCtx = new OfflineAudioContext(buf.numberOfChannels, targetLen, 44100);
  const src = offCtx.createBufferSource();
  src.buffer = buf;
  src.connect(offCtx.destination);
  src.start(0);
  return offCtx.startRendering();
}

/**
 * Resamples decoded buffers, slices each to its trim window, and sends everything
 * to the worker for mixing + MP3 encoding off the main thread.
 */
export async function processAndEncode(
  songs: Song[],
  decodedBuffers: AudioBuffer[],
  onProgress?: (value: number) => void,
  onStatus?: (message: string) => void,
): Promise<Blob> {
  const resampled = await Promise.all(decodedBuffers.map(resampleTo44100));

  type Segment = { left: Float32Array; right: Float32Array; fade: number; sampleRate: number };
  const segments: Segment[] = [];
  let totalLen = 0;

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    const buf = resampled[i];
    const sf = Math.floor(parseTime(s.startTime) * buf.sampleRate);
    const endSec = s.endTime ? parseTime(s.endTime) : buf.duration;
    const ef = Math.min(Math.ceil(endSec * buf.sampleRate), buf.length);
    const len = Math.max(0, ef - sf);
    if (len === 0) continue;

    const srcL = buf.getChannelData(0);
    const srcR = buf.numberOfChannels > 1 ? buf.getChannelData(1) : srcL;

    // slice() copies only the trimmed window — result is transferable
    const left = srcL.slice(sf, sf + len);
    // mono guard: left and right must be separate ArrayBuffers for transfer
    const right = srcL === srcR ? new Float32Array(left) : srcR.slice(sf, sf + len);

    segments.push({ left, right, fade: i < songs.length - 1 ? s.fadeOut : 0, sampleRate: buf.sampleRate });
    totalLen += len;
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../../../workers/mp3Encoder.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = ({ data }: MessageEvent<{ type: string; value?: number; message?: string; buffer?: ArrayBuffer }>) => {
      if (data.type === 'progress') {
        onProgress?.(data.value!);
      } else if (data.type === 'status') {
        onStatus?.(data.message!);
      } else if (data.type === 'done') {
        worker.terminate();
        resolve(new Blob([data.buffer!], { type: 'audio/mp3' }));
      }
    };

    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message)); };

    const transferables = segments.flatMap(s => [s.left.buffer, s.right.buffer]);
    worker.postMessage({ segments, totalLen }, transferables);
  });
}
