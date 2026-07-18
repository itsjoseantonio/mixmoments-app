import { useTranslations } from 'next-intl';
import styles from './Story.module.css';

export function Story() {
  const t = useTranslations('landing.story');

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.quoteMark}>"</div>
        <div>
          <p className={styles.text}>{t('p1')}</p>
          <p className={styles.text}>{t('p2')}</p>
          <p className={styles.signature}>{t('signature')}</p>
        </div>
      </div>
    </section>
  );
}
