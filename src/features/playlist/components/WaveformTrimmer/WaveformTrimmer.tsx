'use client';

import { useRef, useEffect, useCallback } from 'react';
import { formatTime, parseTime } from '@/features/export/lib/audio';
import styles from './WaveformTrimmer.module.css';

const HIT = 14; // px — grab zone radius around each handle

interface WaveformTrimmerProps {
  file: File;
  duration: number;
  startTime: string;
  endTime: string;
  currentTime: number;
  isPlaying: boolean;
  onChange: (field: 'startTime' | 'endTime', value: string) => void;
}

export function WaveformTrimmer({
  file, duration, startTime, endTime, currentTime, isPlaying, onChange,
}: WaveformTrimmerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const peaksRef = useRef<Array<{ min: number; max: number }> | null>(null);
  const dragging = useRef<'start' | 'end' | null>(null);

  // Mutable refs so stable callbacks can read the latest values
  const startSecRef = useRef(0);
  const endSecRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Sync latest prop values into refs so stable callbacks always read current data
  useEffect(() => {
    startSecRef.current = parseTime(startTime);
    endSecRef.current = endTime ? parseTime(endTime) : duration;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
    isPlayingRef.current = isPlaying;
  }, [startTime, endTime, duration, currentTime, isPlaying]);

  const computePeaks = useCallback((cssW: number) => {
    const data = dataRef.current;
    if (!data || cssW <= 0) return;
    const spp = data.length / cssW;
    const peaks: Array<{ min: number; max: number }> = new Array(cssW);
    for (let px = 0; px < cssW; px++) {
      const s = Math.floor(px * spp);
      const e = Math.floor((px + 1) * spp);
      let mn = 0, mx = 0;
      for (let i = s; i < e; i++) {
        if (data[i] < mn) mn = data[i];
        if (data[i] > mx) mx = data[i];
      }
      peaks[px] = { min: mn, max: mx };
    }
    peaksRef.current = peaks;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    if (!cssW || !cssH) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sSec = startSecRef.current;
    const eSec = endSecRef.current;
    const dur = durationRef.current;
    const playTime = currentTimeRef.current;
    const playing = isPlayingRef.current;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    // Background
    ctx.fillStyle = '#f7f3ef';
    ctx.fillRect(0, 0, cssW, cssH);

    const peaks = peaksRef.current;
    if (peaks && peaks.length === cssW && dur > 0) {
      const sx = (sSec / dur) * cssW;
      const ex = (Math.min(eSec, dur) / dur) * cssW;
      const cy = cssH / 2;

      // Waveform bars — gold inside selection, muted outside
      for (let px = 0; px < cssW; px++) {
        const { min, max } = peaks[px];
        ctx.fillStyle = px >= sx && px <= ex ? '#b8955a' : '#ddd5cb';
        const top = cy - max * cy * 0.88;
        const bot = cy + Math.abs(min) * cy * 0.88;
        ctx.fillRect(px, top, 1, Math.max(1, bot - top));
      }

      // Dim overlay outside the selected region
      ctx.fillStyle = 'rgba(247,243,239,0.62)';
      ctx.fillRect(0, 0, sx, cssH);
      ctx.fillRect(ex, 0, cssW - ex, cssH);

      // Handle lines + grab tabs
      const GOLD = '#c8a96e';
      for (const hx of [sx, ex]) {
        const x = Math.round(hx);
        ctx.fillStyle = GOLD;
        ctx.fillRect(x - 1, 0, 2, cssH);    // vertical rule
        ctx.fillRect(x - 5, 0, 10, 9);       // top grab tab
      }
    }

    // Playhead
    if (playing && dur > 0) {
      const px = (playTime / dur) * cssW;
      ctx.strokeStyle = 'rgba(160,50,50,0.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssH);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Decode the file once; re-run only when the File object changes
  useEffect(() => {
    let cancelled = false;
    dataRef.current = null;
    peaksRef.current = null;

    (async () => {
      try {
        const ac = new AudioContext();
        const ab = await file.arrayBuffer();
        if (cancelled) { ac.close(); return; }
        const buf = await ac.decodeAudioData(ab);
        ac.close();
        if (cancelled) return;

        const ch0 = buf.getChannelData(0);
        if (buf.numberOfChannels > 1) {
          const ch1 = buf.getChannelData(1);
          const mono = new Float32Array(ch0.length);
          for (let i = 0; i < mono.length; i++) mono[i] = (ch0[i] + ch1[i]) * 0.5;
          dataRef.current = mono;
        } else {
          dataRef.current = new Float32Array(ch0);
        }

        if (canvasRef.current) computePeaks(canvasRef.current.offsetWidth);
        draw();
      } catch { /* waveform stays blank on decode failure */ }
    })();

    return () => { cancelled = true; };
  }, [file, computePeaks, draw]);

  // Resize observer — sets canvas pixel dimensions and recomputes peaks
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.floor(entries[0].contentRect.width);
      if (cssW <= 0) return;
      const cssH = 56;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      if (dataRef.current) computePeaks(cssW);
      draw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [computePeaks, draw]);

  // Redraw whenever trim points, playhead, or playing state change
  useEffect(() => {
    draw();
  }, [draw, startTime, endTime, currentTime, duration, isPlaying]);

  // --- Pointer interaction ---

  const hitTest = (clientX: number): 'start' | 'end' | null => {
    const canvas = canvasRef.current;
    if (!canvas || durationRef.current <= 0) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const w = rect.width;
    const dur = durationRef.current;
    const sx = (startSecRef.current / dur) * w;
    const ex = (endSecRef.current / dur) * w;
    const dS = Math.abs(x - sx);
    const dE = Math.abs(x - ex);
    return (dS <= HIT || dE <= HIT) ? (dS <= dE ? 'start' : 'end') : null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const target = hitTest(e.clientX);
    if (!target) return;
    dragging.current = target;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!dragging.current) {
      canvas.style.cursor = hitTest(e.clientX) ? 'ew-resize' : 'default';
      return;
    }

    const dur = durationRef.current;
    if (dur <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * dur;

    if (dragging.current === 'start') {
      onChange('startTime', formatTime(Math.max(0, Math.min(t, endSecRef.current - 0.5))));
    } else {
      onChange('endTime', formatTime(Math.min(dur, Math.max(t, startSecRef.current + 0.5))));
    }
  };

  const stopDrag = () => { dragging.current = null; };

  return (
    <div ref={wrapRef} className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
      />
    </div>
  );
}
