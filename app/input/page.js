'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/CrowdnessInputPage.module.css';

export default function CrowdnessInputPage() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [selectedGym, setSelectedGym] = useState('');
    const [crowdness, setCrowdness] = useState('');

    useEffect(() => {
        getLocation()
    }, [location]);

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('브라우저가 위치 정보를 지원하지 않습니다. 혼잡도 정보를 입력할 수 없습니다.');
            router.push('/');
            return;
        }

        const geo = navigator.geolocation;
        const options = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        };

        geo.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error('위치 정보 획득 실패:', error);
                if (error.code === 1) {
                    alert('위치 정보 액세스가 거부되었습니다. 브라우저 설정에서 위치 정보 접근을 허용해주세요.');
                }
            },
            options
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            alert('위치 정보가 필요합니다. 위치 정보를 허용해주세요.');
            return;
        }
        console.log(`체육관: ${selectedGym}, 혼잡도: ${crowdness}, 위치: `, location);
        // 여기에 서버로 데이터를 보내는 로직을 추가할 수 있습니다.
        router.push('/thanks');
    };

    return (
        <div className={styles.crowdnessInputPage}>
            <h2>혼잡도 입력</h2>
            {!location ? <p>위치 정보를 불러오는 중</p> :
                <><p>근처 1KM 클라이밍장 목록</p>
                    <form onSubmit={handleSubmit}>
                        <select
                            value={selectedGym}
                            onChange={(e) => setSelectedGym(e.target.value)}
                            required
                            className={styles.gymSelect}
                        >
                            <option value="">클라이밍장 선택</option>
                            <option value="1">더클라이밍 강남점</option>
                            <option value="2">클라이밍파크 홍대점</option>
                        </select>

                        <div className={styles.crowdnessButtons}>
                            <button type="submit" onClick={() => setCrowdness('low')}
                                    className={`${styles.crowdnessButton} ${styles.low}`}>쾌적
                            </button>
                            <button type="submit" onClick={() => setCrowdness('medium')}
                                    className={`${styles.crowdnessButton} ${styles.medium}`}>보통
                            </button>
                            <button type="submit" onClick={() => setCrowdness('high')}
                                    className={`${styles.crowdnessButton} ${styles.high}`}>혼잡
                            </button>
                            <button type="submit" onClick={() => setCrowdness('veryHigh')}
                                    className={`${styles.crowdnessButton} ${styles.veryHigh}`}>매우 혼잡
                            </button>
                        </div>
                    </form>
                </>}
        </div>
    );
}
