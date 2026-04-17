/// <reference lib="webworker" />

import { Mp3Encoder } from '@breezystack/lamejs';

interface WorkerSegment {
  left: Float32Array;
  right: Float32Array;
  fade: number;
  sampleRate: number;
}

interface WorkerInput {
  segments: WorkerSegment[];
  totalLen: number;
}

type WorkerOutput =
  | { type: 'progress'; value: number }
  | { type: 'status'; message: string }
  | { type: 'done'; buffer: ArrayBuffer };

self.onmessage = ({ data }: MessageEvent<WorkerInput>) => {
  const { segments, totalLen } = data;

  // ── Mix ──────────────────────────────────────────────────────────────────
  const mL = new Float32Array(totalLen);
  const mR = new Float32Array(totalLen);
  let offset = 0;

  for (let si = 0; si < segments.length; si++) {
    const { left, right, fade, sampleRate } = segments[si];
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

    const msg: WorkerOutput = { type: 'progress', value: 20 + Math.round(((si + 1) / segments.length) * 40) };
    self.postMessage(msg);
  }

  // ── Encode ───────────────────────────────────────────────────────────────
  const statusMsg: WorkerOutput = { type: 'status', message: 'Encoding MP3…' };
  self.postMessage(statusMsg);

  const encoder = new Mp3Encoder(2, 44100, 128);
  const chunks: Uint8Array[] = [];
  const CHUNK = 1152;

  const toI16 = (f: Float32Array): Int16Array => {
    const out = new Int16Array(f.length);
    for (let j = 0; j < f.length; j++) {
      out[j] = Math.max(-32768, Math.min(32767, Math.round(f[j] * 32767)));
    }
    return out;
  };

  const i16L = toI16(mL);
  const i16R = toI16(mR);

  for (let i = 0; i < totalLen; i += CHUNK) {
    const encoded = encoder.encodeBuffer(
      i16L.subarray(i, i + CHUNK),
      i16R.subarray(i, i + CHUNK),
    );
    if (encoded.length > 0) chunks.push(encoded);
    if (i % (CHUNK * 100) === 0) {
      const prog: WorkerOutput = { type: 'progress', value: 60 + Math.round((i / totalLen) * 35) };
      self.postMessage(prog);
    }
  }

  const last = encoder.flush();
  if (last.length > 0) chunks.push(last);

  const totalBytes = chunks.reduce((a, b) => a + b.length, 0);
  const combined = new Uint8Array(totalBytes);
  let off = 0;
  for (const chunk of chunks) { combined.set(chunk, off); off += chunk.length; }

  const done: WorkerOutput = { type: 'done', buffer: combined.buffer };
  self.postMessage(done, [combined.buffer]);
};
