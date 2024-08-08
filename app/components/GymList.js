import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function GymList({ gyms }) {
    return (
        <div className={styles.gymList}>
            {gyms.map(gym => (
                <Link href={`/input/${gym.id}`} key={gym.id}>
                    <div className={styles.gymItem}>
                        <img src={gym.logo} alt={gym.name} className={styles.gymLogo} />
                        <div className={styles.gymInfo}>
                            <div className={styles.gymName}>{gym.name}</div>
                            <div className={styles.gymAddress}>{gym.address}</div>
                        </div>
                        <div className={`${styles.crowdness} ${styles[gym.crowdness]}`}>
                            {gym.crowdness === 'low' ? '쾌적' : gym.crowdness === 'medium' ? '보통' : '혼잡'}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
