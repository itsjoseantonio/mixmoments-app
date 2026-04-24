import { SignInButton, SignedIn, SignedOut, UserButton as ClerkUserButton } from '@clerk/nextjs';
import styles from './AuthBar.module.css';

interface AuthBarProps {
  isPro: boolean;
}

export function AuthBar({ isPro }: AuthBarProps) {
  return (
    <div className={styles.bar}>
      <SignedIn>
        {isPro && <span className={styles.proBadge}>lifetime</span>}
        <ClerkUserButton afterSignOutUrl={window.location.href} />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className={styles.signInBtn}>Sign in</button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
