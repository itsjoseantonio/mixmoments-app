'use client';
import { useEffect } from 'react';
import { initAnalytics } from '@/shared/lib/analytics';

export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) initAnalytics(key, process.env.NEXT_PUBLIC_POSTHOG_HOST);
  }, []);
  return null;
}
