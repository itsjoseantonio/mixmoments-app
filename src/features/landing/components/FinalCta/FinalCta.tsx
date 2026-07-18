import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './FinalCta.module.css';

export function FinalCta() {
  const t = useTranslations('landing.finalCta');

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>{t('heading')}</h2>
        <p className={styles.sub}>{t('sub')}</p>
        <Link href="/app" className={styles.cta}>{t('cta')}</Link>
      </div>
    </section>
  );
}
