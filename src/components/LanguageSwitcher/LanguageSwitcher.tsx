'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className={className ? `${styles.switcher} ${className}` : styles.switcher}>
      {routing.locales.map((l, i) => (
        <span key={l} className={styles.item}>
          {i > 0 && <span className={styles.divider}>·</span>}
          <Link
            href={pathname}
            locale={l}
            className={l === locale ? styles.active : styles.link}
            aria-current={l === locale ? 'true' : undefined}
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
