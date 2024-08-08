'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/CrowdnessInputPage.module.css';

export default function CrowdnessInputPage() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [selectedGym, setSelectedGym] = useState('');
    const [nearbyGyms, setNearbyGyms] = useState([]);
    const [crowdness, setCrowdness] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getLocation();
    }, []);

    useEffect(() => {
        if (location) {
            fetchNearbyGyms();
        }
    }, [location]);

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('브라우저가 위치 정보를 지원하지 않습니다. 혼잡도 정보를 입력할 수 없습니다.');
            router.push('/');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error('위치 정보 획득 실패:', error);
                setIsLoading(false);
                if (error.code === 1) {
                    alert('위치 정보 액세스가 거부되었습니다. 브라우저 설정에서 위치 정보 접근을 허용해주세요.');
                }
            }
        );
    };

    const fetchNearbyGyms = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/gyms/nearby?latitude=${location.latitude}&longitude=${location.longitude}`);
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            const data = await response.json();
            setNearbyGyms(data);
        } catch (error) {
            console.error('Error fetching nearby gyms:', error);
            alert('주변 클라이밍장 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGym || !crowdness) {
            alert('클라이밍장과 혼잡도를 모두 선택해주세요.');
            return;
        }
        // TODO: 서버로 데이터 전송 로직 구현
        console.log(`체육관: ${selectedGym}, 혼잡도: ${crowdness}`);
        router.push('/thanks');
    };

    if (isLoading) {
        return <div>위치 정보를 불러오는 중...</div>;
    }

    return (
        <div className={styles.crowdnessInputPage}>
            <h2>혼잡도 입력</h2>
            {nearbyGyms.length > 0 ? (
                <form onSubmit={handleSubmit}>
                    <select
                        value={selectedGym}
                        onChange={(e) => setSelectedGym(e.target.value)}
                        required
                        className={styles.gymSelect}
                    >
                        <option value="">클라이밍장 선택</option>
                        {nearbyGyms.map(gym => (
                            <option key={gym.id} value={gym.id}>
                                {gym.name} ({gym.distance.toFixed(2)} km)
                            </option>
                        ))}
                    </select>

                    <div className={styles.crowdnessButtons}>
                        <button type="button" onClick={() => setCrowdness('low')}
                                className={`${styles.crowdnessButton} ${styles.low}`}>쾌적
                        </button>
                        <button type="button" onClick={() => setCrowdness('medium')}
                                className={`${styles.crowdnessButton} ${styles.medium}`}>보통
                        </button>
                        <button type="button" onClick={() => setCrowdness('high')}
                                className={`${styles.crowdnessButton} ${styles.high}`}>혼잡
                        </button>
                        <button type="button" onClick={() => setCrowdness('veryHigh')}
                                className={`${styles.crowdnessButton} ${styles.veryHigh}`}>매우 혼잡
                        </button>
                    </div>
                    <button type="submit" className={styles.submitButton}>제출</button>
                </form>
            ) : (
                <p>주변에 클라이밍장이 없습니다.</p>
            )}
        </div>
    );
}
