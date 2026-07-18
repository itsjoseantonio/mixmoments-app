import { useTranslations } from 'next-intl';
import styles from './UseCases.module.css';

type UseCase = { icon: string; title: string; desc: string };

export function UseCases() {
  const t = useTranslations('landing.useCases');
  const items = t.raw('items') as UseCase[];

  return (
    <section id="uses" className={styles.section}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <h2 className={styles.heading}>{t('heading')}</h2>
        <p className={styles.sub}>{t('sub')}</p>
      </div>
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.title} className={styles.card}>
            <div className={styles.icon}>{item.icon}</div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDesc}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
