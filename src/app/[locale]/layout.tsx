import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from '../posthog-provider';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/config';
import '../../index.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: '#1e1a17',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <ClerkProvider>
      <NextIntlClientProvider messages={messages}>
        <html lang={locale}>
          <body suppressHydrationWarning>
            <PostHogProvider />
            {children}
            <Analytics />
          </body>
        </html>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}
