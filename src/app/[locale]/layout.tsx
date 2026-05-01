import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const base = 'https://mixmoments.app';

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    authors: [{ name: 'Mixmoments' }],
    robots: 'index, follow',
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { en: `${base}/en`, es: `${base}/es`, 'x-default': `${base}/en` },
    },
    openGraph: {
      type: 'website',
      siteName: 'Mixmoments',
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `${base}/${locale}`,
      images: [{ url: `${base}/og-image.png`, width: 1200, height: 630, alt: 'Mixmoments playlist builder interface' }],
      locale: locale === 'es' ? 'es_ES' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [{ url: `${base}/og-image.png`, alt: 'Mixmoments playlist builder interface' }],
    },
  };
}

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
