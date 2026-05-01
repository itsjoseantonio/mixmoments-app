import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUser, SignInButton } from '@clerk/nextjs';
import { CheckoutResponseSchema } from '../../schemas';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const t = useTranslations('billing.upgrade');
  const freeFeatures = t.raw('freeFeatures') as string[];
  const proFeatures = t.raw('proFeatures') as string[];
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          userEmail: user.primaryEmailAddress?.emailAddress,
        }),
      });
      const raw = await res.json();
      const data = CheckoutResponseSchema.parse(raw);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? t('unknownError'));
      }
    } catch {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.badge}>{t('badge')}</div>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.plans}>
          <div className={styles.planCard}>
            <div className={styles.planName}>{t('freePlan')}</div>
            <div className={styles.planPrice}>$0</div>
            <ul className={styles.featureList}>
              {freeFeatures.map(f => (
                <li key={f} className={styles.featureItem}><CheckIcon muted /> {f}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.planCard} ${styles.planCardPro}`}>
            <div className={styles.planBadge}>{t('recommended')}</div>
            <div className={styles.planName}>{t('lifetimePlan')}</div>
            <div className={styles.planPrice}>
              $19 <span className={styles.planPriceSub}>{t('priceOnce')}</span>
            </div>
            <ul className={styles.featureList}>
              {proFeatures.map(f => (
                <li key={f} className={styles.featureItem}><CheckIcon /> {f}</li>
              ))}
            </ul>

            {isSignedIn ? (
              <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
                {loading ? t('redirecting') : t('getAccess')}
              </button>
            ) : (
              <SignInButton mode="modal" fallbackRedirectUrl={window.location.href}>
                <button className={styles.upgradeBtn}>{t('signInToUpgrade')}</button>
              </SignInButton>
            )}

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>

        <p className={styles.footer}>{t('footer')}</p>
      </div>
    </div>
  );
}

function CheckIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="6" fill={muted ? 'var(--parchment)' : 'var(--rose-light)'} />
      <path
        d="M3.5 6.5l2 2 4-4"
        stroke={muted ? 'var(--ink-muted)' : 'var(--rose-dark)'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
