'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from './page.module.css';
import {getSession, useSession} from "next-auth/react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [gyms, setGyms] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();

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
        await axios.get('http://localhost:8080/api/gyms', {
            headers: {
                'JSESSIONID': getSession('JSESSIONID')
            }
        })
            .then(response => {
                response.data.result.forEach(gym => {
                    gym.crowdness = convertToCrowdness(gym.crowdness);
                })
                setGyms(response.data.result);
            })
    };

    const convertToCrowdness = (level) => {
        switch(level) {
            case 1:
                return 'low';
            case 2:
                return 'medium';
            case 3:
                return 'high';
            case 4:
                return 'veryHigh';
            default:
                return 'none';
        }

    }

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
                                {gym.crowdness === 'low' ? '쾌적' : gym.crowdness === 'medium' ? '보통' :
                                    gym.crowdness === 'high' ? '혼잡' :
                                        gym.crowdness === 'veryHigh' ? '매우혼잡' : '미정'}
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
