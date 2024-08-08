'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [gyms, setGyms] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
        fetchGyms();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            setIsLoggedIn(data.result.isLoggedIn);
        } catch (error) {
            console.error('Failed to check login status', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGyms = async () => {
        setGyms([
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
            { id: '2', name: '클라이밍파크 홍대점', address: '서울 마포구 서교동 456-78', crowdness: 'medium', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc" },
            { id: '1', name: '더클라이밍 강남점', address: '서울 강남구 역삼동 123-45', crowdness: 'low', logo: "https://spirit-files-bucket.s3.ap-northeast-2.amazonaws.com/z5crszpomynne34sg9c4xlrxuwtc"},
        ]);
    };

    const handleKakaoLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        window.location.href = 'http://localhost:8080/logout';
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`${isLoggedIn ? styles.container : styles.ncontainer}`}>
            {isLoggedIn && <input
                type="text"
                className={styles.searchInput}
                placeholder="클라이밍장 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />}
            <div className={styles.gymListContainer}>
                <div className={`${styles.gymList} ${!isLoggedIn ? styles.blurred : ''}`}>
                    {gyms.filter(gym => gym.name.toLowerCase().includes(searchTerm.toLowerCase())).map(gym => (
                        <div key={gym.id} className={styles.gymItem}>
                            <img src={gym.logo} alt={gym.name} className={styles.gymLogo} />
                            <div className={styles.gymInfo}>
                                <div className={styles.gymName}>{gym.name}</div>
                                <div className={styles.gymAddress}>{gym.address}</div>
                            </div>
                            <div className={`${styles.crowdness} ${styles[gym.crowdness]}`}>
                                {gym.crowdness === 'low' ? '쾌적' : gym.crowdness === 'medium' ? '보통' : '혼잡'}
                            </div>
                        </div>
                    ))}
                </div>
                {!isLoggedIn && (
                    <div className={styles.loginOverlay}>
                        <div className={styles.loginBox}>
                            <p>클라이밍장 혼잡도를 한눈에 보고싶다면?</p>
                            <button onClick={handleKakaoLogin} className={styles.kakaoLoginButton}>
                                카카오 로그인
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isLoggedIn &&
                <>
                <Link href="/input" className={styles.crowdnessButton}>혼잡도 입력하기</Link>
                <button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button>
                </>
            }
        </div>
    );
}
