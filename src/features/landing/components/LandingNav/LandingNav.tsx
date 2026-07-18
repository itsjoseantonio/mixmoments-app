import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './LandingNav.module.css';

export function LandingNav() {
  const t = useTranslations('landing.nav');

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <img src="/favicon.svg" alt="" width={20} height={20} />
          <span className={styles.logoText}>Mixmoments</span>
        </Link>
        <div className={styles.links}>
          <a href="#how">{t('howItWorks')}</a>
          <a href="#uses">{t('useCases')}</a>
          {/* <a href="#pricing">{t('pricing')}</a> */}
        </div>
        <Link href="/app" className={styles.cta}>{t('cta')}</Link>
      </nav>
    </header>
  );
}
