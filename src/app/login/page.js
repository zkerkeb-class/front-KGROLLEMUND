'use client';

import AuthForm from '@/components/AuthForm';
import styles from './login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.loginWrapper}>
        <div className={styles.imageSection}>
          <div className={styles.overlay}>
            <p className={styles.quote}>
              &ldquo;Notre générateur de devis alimenté par l&apos;IA vous permet de créer des estimations précises pour vos projets de développement web en quelques minutes.&rdquo;
            </p>
            <p className={styles.author}>- Équipe Quote Generator</p>
          </div>
        </div>
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <div className={styles.logo}>
              <FontAwesomeIcon icon={faLaptopCode} />
              QuoteGen
            </div>
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
} 