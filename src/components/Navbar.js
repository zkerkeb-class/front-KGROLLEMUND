'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../styles/Navbar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faFileInvoiceDollar, faLock, faCrown, faUser } from '@fortawesome/free-solid-svg-icons';
import LogoutButton from './LogoutButton';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleSubscribe = () => {
    router.push('/subscription');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.userInfo}>
        {user && (
          <>
            <span className={styles.userIcon}>
              <FontAwesomeIcon icon={faUser} />
            </span>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userEmail}>{user.email}</span>
            {user.isSubscribed && (
              <span className={styles.badge}>Abonné</span>
            )}
          </>
        )}
      </div>
      
      <div className={styles.navLinks}>
        <Link href="/">
          <FontAwesomeIcon icon={faHome} className={styles.navIcon} />
          <span>Accueil</span>
        </Link>
        <Link href="/quote">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className={styles.navIcon} />
          <span>Devis</span>
        </Link>
        {user?.isAdmin && (
          <Link href="/backoffice">
            <FontAwesomeIcon icon={faLock} className={styles.navIcon} />
            <span>Administration</span>
          </Link>
        )}
      </div>
      
      <div className={styles.actionButtons}>
        {user && !user.isSubscribed ? (
          <button className={styles.subscribeBtn} onClick={handleSubscribe}>
            <FontAwesomeIcon icon={faCrown} className={styles.subscribeIcon} />
            <span>S&apos;abonner</span>
          </button>
        ) : user && user.isSubscribed ? (
          <div className={styles.subscribedBadge}>
            <FontAwesomeIcon icon={faCrown} className={styles.subscribedIcon} />
            <span>Abonné</span>
          </div>
        ) : null}
        
        <LogoutButton />
      </div>
    </nav>
  );
} 