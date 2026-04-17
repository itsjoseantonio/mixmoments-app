import { z } from 'zod';

export const SongSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().min(0),
  startTime: z.string(),
  endTime: z.string(),
  fadeOut: z.number().min(0).max(8),
});

export type SongData = z.infer<typeof SongSchema>;
