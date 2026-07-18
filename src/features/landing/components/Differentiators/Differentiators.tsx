import { useTranslations } from 'next-intl';
import styles from './Differentiators.module.css';

type DiffItem = { num: string; title: string; desc: string };

export function Differentiators() {
  const t = useTranslations('landing.differentiators');
  const items = t.raw('items') as DiffItem[];

  return (
    <section className={styles.section}>
      <div className={styles.strip}>
        {items.map((item) => (
          <div key={item.num} className={styles.item}>
            <div className={styles.num}>{item.num}</div>
            <h4 className={styles.title}>{item.title}</h4>
            <p className={styles.desc}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
