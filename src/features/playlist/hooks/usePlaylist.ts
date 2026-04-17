import { useState, useCallback, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { formatTime } from '@/features/export/lib/audio';
import type { Song } from '../types';

export function usePlaylist() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioBuffers = useRef<Record<string, ArrayBuffer>>({});
  const fileNames = useRef<Set<string>>(new Set());

  const addFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (fileNames.current.has(file.name)) continue;
      fileNames.current.add(file.name);

      const reader = new FileReader();
      reader.onload = async (e) => {
        let duration = 0;
        const ctx = new AudioContext();
        try {
          const buf = await ctx.decodeAudioData((e.target!.result as ArrayBuffer).slice(0));
          duration = buf.duration;
        } catch {}
        finally {
          ctx.close();
        }

        const id = `${Date.now()}-${Math.random()}`;
        audioBuffers.current[id] = e.target!.result as ArrayBuffer;

        setSongs(prev => [...prev, {
          id,
          file,
          name: file.name.replace(/\.[^.]+$/, ''),
          duration,
          startTime: '0:00',
          endTime: duration > 0 ? formatTime(duration) : '',
          fadeOut: 3,
        }]);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const updateSong = useCallback((id: string, field: string, value: string | number) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const removeSong = useCallback((id: string) => {
    setPlayingId(prev => (prev === id ? null : prev));
    setSongs(prev => {
      const song = prev.find(s => s.id === id);
      if (song) {
        fileNames.current.delete(song.file.name);
        delete audioBuffers.current[id];
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const reorder = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSongs(prev => {
        const from = prev.findIndex(s => s.id === active.id);
        const to = prev.findIndex(s => s.id === over.id);
        return arrayMove(prev, from, to);
      });
    }
  }, []);

  return { songs, audioBuffers, addFiles, updateSong, removeSong, reorder, playingId, setPlayingId };
}
