import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/config';

const base = 'https://mixmoments.live';

export async function buildMetadata({ locale, path = '' }: { locale: Locale; path?: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const url = `${base}/${locale}${path}`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    authors: [{ name: 'Mixmoments' }],
    robots: 'index, follow',
    icons: { icon: '/favicon.svg' },
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
        'x-default': `${base}/${routing.defaultLocale}${path}`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Mixmoments',
      title: t('ogTitle'),
      description: t('ogDescription'),
      url,
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
