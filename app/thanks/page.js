import Link from 'next/link';
import styles from '../styles/Thanks.module.css';

export default function Page() {
    return (
        <div className={styles.thanksPage}>
            <div className={styles.thanksEmoji}>🙏</div>
            <h2 className={styles.thanksMessage}>감사합니다!</h2>
            <p className={styles.thanksDescription}>혼잡도 정보를 제공해주셔서 감사합니다.</p>
            <Link href="/" className={styles.button}>
                메인으로 돌아가기
            </Link>
        </div>
    );
}
