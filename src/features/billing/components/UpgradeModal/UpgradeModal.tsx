import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { CheckoutResponseSchema } from '../../schemas';
import styles from './UpgradeModal.module.css';

const FEATURES_FREE = [
  'Up to 5 songs per export',
  'Trim start & end per song',
  'Fade-out transitions',
  'No account needed',
];

const FEATURES_PRO = [
  'Unlimited songs per export',
  'Trim start & end per song',
  'Fade-out transitions',
  'Lifetime access — pay once',
  'All future features included',
];

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
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
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.badge}>Upgrade</div>
        <h2 className={styles.title}>You've hit the free limit</h2>
        <p className={styles.subtitle}>
          Free plan supports up to 5 songs. Unlock unlimited exports for any event — parties, weddings,
          festivals, corporate — with a one-time payment.
        </p>

        <div className={styles.plans}>
          <div className={styles.planCard}>
            <div className={styles.planName}>Free</div>
            <div className={styles.planPrice}>$0</div>
            <ul className={styles.featureList}>
              {FEATURES_FREE.map(f => (
                <li key={f} className={styles.featureItem}><CheckIcon muted /> {f}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.planCard} ${styles.planCardPro}`}>
            <div className={styles.planBadge}>Recommended</div>
            <div className={styles.planName}>Lifetime</div>
            <div className={styles.planPrice}>
              $19 <span className={styles.planPriceSub}>once</span>
            </div>
            <ul className={styles.featureList}>
              {FEATURES_PRO.map(f => (
                <li key={f} className={styles.featureItem}><CheckIcon /> {f}</li>
              ))}
            </ul>

            {isSignedIn ? (
              <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
                {loading ? 'Redirecting…' : 'Get lifetime access — $19'}
              </button>
            ) : (
              <SignInButton mode="modal" fallbackRedirectUrl={window.location.href}>
                <button className={styles.upgradeBtn}>Sign in to upgrade</button>
              </SignInButton>
            )}

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>

        <p className={styles.footer}>
          Secure payment via Stripe · No subscription · Cancel anytime isn't needed — it's yours forever
        </p>
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
