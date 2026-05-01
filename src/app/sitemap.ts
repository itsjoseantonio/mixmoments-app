import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const base = 'https://mixmoments.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${base}/${l}`]),
      ),
    },
  }));
}
