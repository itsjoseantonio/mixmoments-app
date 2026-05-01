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

function encodeChunk(left: Float32Array, right: Float32Array): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../../../workers/mp3Encoder.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = ({ data }: MessageEvent<ArrayBuffer>) => {
      worker.terminate();
      resolve(data);
    };
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message)); };
    worker.postMessage({ left, right }, [left.buffer, right.buffer]);
  });
}

export async function processAndEncode(
  songs: Song[],
  decodedBuffers: AudioBuffer[],
  onProgress?: (value: number) => void,
  onStatus?: (message: string) => void,
): Promise<Blob> {
  const resampled = await Promise.all(decodedBuffers.map(resampleTo44100));

  // Build mixed stereo buffers with fade curves applied
  let totalLen = 0;
  type Segment = { left: Float32Array; right: Float32Array; fade: number; sampleRate: number };
  const segments: Segment[] = [];

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
    const left = srcL.slice(sf, sf + len);
    const right = srcL === srcR ? new Float32Array(left) : srcR.slice(sf, sf + len);

    segments.push({ left, right, fade: i < songs.length - 1 ? s.fadeOut : 0, sampleRate: buf.sampleRate });
    totalLen += len;
  }

  onStatus?.('Mixing tracks…');

  const mL = new Float32Array(totalLen);
  const mR = new Float32Array(totalLen);
  let offset = 0;

  for (const { left, right, fade, sampleRate } of segments) {
    const len = left.length;
    const fadeFrames = Math.floor(fade * sampleRate);
    for (let f = 0; f < len; f++) {
      let g = 1;
      if (fade > 0 && f >= len - fadeFrames) {
        g = Math.max(0, 1 - (f - (len - fadeFrames)) / fadeFrames);
      }
      mL[offset + f] = left[f] * g;
      mR[offset + f] = right[f] * g;
    }
    offset += len;
  }

  onProgress?.(25);
  onStatus?.('Encoding MP3…');

  // Split at MP3 frame boundaries (1,152 samples/frame) and encode in parallel.
  // MP3 frames are self-contained — CBR chunks can be concatenated byte-for-byte.
  const FRAME = 1152;
  const numWorkers = Math.min(navigator.hardwareConcurrency ?? 4, 8);
  const framesPerWorker = Math.ceil(Math.ceil(totalLen / FRAME) / numWorkers);
  const samplesPerWorker = framesPerWorker * FRAME;

  let done = 0;

  const chunkPromises = Array.from({ length: numWorkers }, (_, wi) => {
    const start = wi * samplesPerWorker;
    if (start >= totalLen) return Promise.resolve(new ArrayBuffer(0));
    const end = Math.min(start + samplesPerWorker, totalLen);

    // slice() copies — each worker gets its own transferable buffers
    const left = mL.slice(start, end);
    const right = mR.slice(start, end);

    return encodeChunk(left, right).then((buf) => {
      done++;
      onProgress?.(25 + Math.round((done / numWorkers) * 70));
      return buf;
    });
  });

  const results = await Promise.all(chunkPromises);

  const totalBytes = results.reduce((a, b) => a + b.byteLength, 0);
  const combined = new Uint8Array(totalBytes);
  let off = 0;
  for (const result of results) {
    combined.set(new Uint8Array(result), off);
    off += result.byteLength;
  }

  return new Blob([combined], { type: 'audio/mp3' });
}
