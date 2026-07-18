import { useTranslations } from 'next-intl';
import styles from './HowItWorks.module.css';

type Step = { num: string; title: string; desc: string };

export function HowItWorks() {
  const t = useTranslations('landing.howItWorks');
  const steps = t.raw('steps') as Step[];

  return (
    <section id="how" className={styles.section}>
      <div className={styles.head}>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <h2 className={styles.heading}>{t('heading')}</h2>
      </div>
      <div className={styles.steps}>
        {steps.map((step) => (
          <div key={step.num} className={styles.step}>
            <span className={styles.stepNum}>{step.num}</span>
            <div className={styles.stepLine} />
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
