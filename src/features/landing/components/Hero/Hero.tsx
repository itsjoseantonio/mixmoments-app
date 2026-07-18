import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './Hero.module.css';

export function Hero() {
  const t = useTranslations('landing.hero');

  return (
    <section className={styles.section}>
      <div>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <h1 className={styles.heading}>
          {t('heading')} <span className={styles.italic}>{t('headingItalic')}</span>.
        </h1>
        <p className={styles.sub}>{t('sub')}</p>
        <div className={styles.actions}>
          <Link href="/app" className={styles.btnPrimary}>{t('ctaPrimary')}</Link>
          <a href="#how" className={styles.btnGhost}>{t('ctaSecondary')}</a>
        </div>
        <div className={styles.microcopy}>{t('microcopy')}</div>
      </div>

      <div className={styles.mockCard}>
        <div className={styles.mockRow}>
          <span className={styles.mockDot} />
          <span className={styles.mockTitle}>{t('mockSong1')}</span>
          <span className={styles.mockTime}>{t('mockTime1')}</span>
        </div>
        <div className={styles.mockRow}>
          <span className={styles.mockDot} />
          <span className={styles.mockTitle}>{t('mockSong2')}</span>
          <span className={styles.mockTime}>{t('mockTime2')}</span>
        </div>
        <div className={styles.mockRow}>
          <span className={styles.mockDot} />
          <span className={styles.mockTitle}>{t('mockSong3')}</span>
          <span className={styles.mockTime}>{t('mockTime3')}</span>
        </div>
        <div className={styles.mockExport}>
          <span>{t('mockSummary')}</span>
          <span className={styles.mockBadge}>{t('mockExport')}</span>
        </div>
      </div>
    </section>
  );
}
