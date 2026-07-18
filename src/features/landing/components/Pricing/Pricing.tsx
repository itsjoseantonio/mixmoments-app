import { useTranslations } from 'next-intl';
import styles from './Pricing.module.css';

export function Pricing() {
  const t = useTranslations('landing.pricing');
  const freeFeatures = t.raw('free.features') as string[];
  const proFeatures = t.raw('pro.features') as string[];

  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <h2 className={styles.heading}>{t('heading')}</h2>
      </div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.tag}>{t('free.tag')}</span>
          <h3 className={styles.cardTitle}>{t('free.title')}</h3>
          <div className={styles.amount}>{t('free.amount')}</div>
          <ul className={styles.features}>
            {freeFeatures.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div className={`${styles.card} ${styles.cardFeatured}`}>
          <span className={styles.tag}>{t('pro.tag')}</span>
          <h3 className={styles.cardTitle}>{t('pro.title')}</h3>
          <div className={styles.amount}>{t('pro.amount')}</div>
          <ul className={styles.features}>
            {proFeatures.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
