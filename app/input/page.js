'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/CrowdnessInputPage.module.css';

export default function CrowdnessInputPage() {
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [selectedGym, setSelectedGym] = useState('');
    const [nearbyGyms, setNearbyGyms] = useState([]);
    const [crowdness, setCrowdness] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [canVote, setCanVote] = useState(true);
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

    useEffect(() => {
        getLocation();
        checkVotingEligibility();
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
            const response = await fetch(`${serverUrl}/api/gyms/nearby?latitude=${location.latitude}&longitude=${location.longitude}`);
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

    const checkVotingEligibility = async () => {
        try {
            const response = await fetch(`${serverUrl}/api/traffic/can-vote`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCanVote(data);
            } else if (response.status === 401) {
                router.push('/');
            }
        } catch (error) {
            console.error('Error checking voting eligibility:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGym || crowdness === null) {
            alert('클라이밍장과 혼잡도를 모두 선택해주세요.');
            return;
        }

        if (!canVote) {
            alert('오늘은 이미 투표하셨습니다. 내일 다시 시도해주세요.');
            return;
        }

        try {
            const response = await fetch(`${serverUrl}/api/traffic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gymId: selectedGym,
                    busynessLevel: crowdness
                }),
                credentials: 'include'
            });

            if (response.status === 401) {
                router.push('/');
                return;
            }

            if (response.status === 403) {
                alert('오늘은 이미 투표하셨습니다. 내일 다시 시도해주세요.');
                setCanVote(false);
                return;
            }

            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }

            alert('혼잡도 정보가 성공적으로 제출되었습니다.');
            router.push('/thanks');
        } catch (error) {
            console.error('Error submitting traffic data:', error);
            alert('혼잡도 정보 제출에 실패했습니다. 다시 시도해주세요.');
        }
    };

    if (isLoading) {
        return <div>위치 정보를 불러오는 중...</div>;
    }

    return (
        <div className={styles.crowdnessInputPage}>
            <h2>혼잡도 입력</h2>
            {!canVote && <p>오늘은 이미 투표하셨습니다. 내일 다시 시도해주세요.</p>}
            {canVote && nearbyGyms.length > 0 ? (
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
                        <button type="submit" onClick={() => setCrowdness(1)}
                                className={`${styles.crowdnessButton} ${crowdness === 1 ? styles.selected : ''} ${styles.low}`}>쾌적
                        </button>
                        <button type="submit" onClick={() => setCrowdness(2)}
                                className={`${styles.crowdnessButton} ${crowdness === 2 ? styles.selected : ''} ${styles.medium}`}>보통
                        </button>
                        <button type="submit" onClick={() => setCrowdness(3)}
                                className={`${styles.crowdnessButton} ${crowdness === 3 ? styles.selected : ''} ${styles.high}`}>혼잡
                        </button>
                        <button type="submit" onClick={() => setCrowdness(4)}
                                className={`${styles.crowdnessButton} ${crowdness === 4 ? styles.selected : ''} ${styles.veryHigh}`}>매우 혼잡
                        </button>
                    </div>
                </form>

            ) : (
                canVote && <p>근처에 클라이밍 센터가 없습니다.</p>
            )}
        </div>
    );
}
