import styles from './page.module.css';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.outerContainer}>
        <p className={styles.mainText}>
          stillflow是一个真正将公共账本落到实处的一个应用
        </p>
        <Link href="/registrar" passHref>
          <button className={styles.launchButton}>
            launch APP
          </button>
        </Link>
      </div>
    </main>
  );
}