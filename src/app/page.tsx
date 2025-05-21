import styles from './page.module.css';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.outerContainer}>
        <p className={styles.mainText}>
          Stillflow is a protocol that truly implements public ledgers
        </p>
        <Link href="/registrar" passHref>
          <button className={styles.launchButton}>
            Launch APP
          </button>
        </Link>
      </div>
    </main>
  );
}