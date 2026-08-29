import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import type { Locale } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale: locale as Locale, path: '/app' });
}

export { default } from '@/App';
