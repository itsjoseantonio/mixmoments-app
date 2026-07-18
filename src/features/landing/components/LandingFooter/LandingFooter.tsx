import { useTranslations } from 'next-intl';
import styles from './LandingFooter.module.css';

export function LandingFooter() {
  const t = useTranslations('landing');

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>{t('footer')}</div>
    </footer>
  );
}
