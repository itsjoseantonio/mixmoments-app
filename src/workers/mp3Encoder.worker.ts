/// <reference lib="webworker" />

import { Mp3Encoder } from '@breezystack/lamejs';

interface WorkerInput {
  left: Float32Array;
  right: Float32Array;
}

const toI16 = (f: Float32Array): Int16Array => {
  const out = new Int16Array(f.length);
  for (let j = 0; j < f.length; j++) {
    out[j] = Math.max(-32768, Math.min(32767, Math.round(f[j] * 32767)));
  }
  return out;
};

self.onmessage = ({ data }: MessageEvent<WorkerInput>) => {
  const { left, right } = data;
  const CHUNK = 1152;

  const encoder = new Mp3Encoder(2, 44100, 128);
  const chunks: Uint8Array[] = [];

  const i16L = toI16(left);
  const i16R = toI16(right);

  for (let i = 0; i < left.length; i += CHUNK) {
    const encoded = encoder.encodeBuffer(
      i16L.subarray(i, i + CHUNK),
      i16R.subarray(i, i + CHUNK),
    );
    if (encoded.length > 0) chunks.push(new Uint8Array(encoded));
  }

  const last = encoder.flush();
  if (last.length > 0) chunks.push(new Uint8Array(last));

  const totalBytes = chunks.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(totalBytes);
  let off = 0;
  for (const chunk of chunks) { result.set(chunk, off); off += chunk.length; }

  self.postMessage(result.buffer, [result.buffer]);
};
