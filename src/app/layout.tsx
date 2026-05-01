import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from './posthog-provider';
import '../index.css';

export const viewport: Viewport = {
  themeColor: '#1e1a17',
};

export const metadata: Metadata = {
  title: 'Mixmoments — Event Playlist Builder | Merge MP3s Online',
  description:
    'Build custom event playlists in your browser. Load MP3 files, set trim points, configure fade-out transitions between tracks, and export everything as one merged MP3. Free, no uploads, no software needed.',
  keywords:
    'playlist builder, mp3 merger, event playlist, wedding playlist, party music mixer, audio editor online, merge mp3, fade transition, trim audio, browser mp3 tool',
  authors: [{ name: 'Mixmoments' }],
  robots: 'index, follow',
  alternates: { canonical: 'https://mixmoments.app/' },
  openGraph: {
    type: 'website',
    siteName: 'Mixmoments',
    title: 'Mixmoments — Event Playlist Builder',
    description:
      'Build custom event playlists in your browser. Trim songs, add fade-out transitions, and export as one merged MP3. Free, no uploads required.',
    url: 'https://mixmoments.app/',
    images: [
      {
        url: 'https://mixmoments.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mixmoments playlist builder interface',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mixmoments — Event Playlist Builder',
    description:
      'Build custom event playlists in your browser. Trim songs, add fade-out transitions, and export as one merged MP3. Free, no uploads required.',
    images: [
      {
        url: 'https://mixmoments.app/og-image.png',
        alt: 'Mixmoments playlist builder interface',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning>
          <PostHogProvider />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
