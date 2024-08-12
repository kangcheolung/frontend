'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from './page.module.css';
import {getSession, useSession} from "next-auth/react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [brands, setBrands] = useState([]);
    const [gyms, setGyms] = useState([]);
    const [filteredGyms, setFilteredGyms] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
    const [canVote, setCanVote] = useState(true);
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

    useEffect(() => {
        checkLoginStatus();
        fetchBrands();
        fetchGyms();
        checkVotingEligibility();
    }, []);

    useEffect(() => {
        const filtered = gyms.filter(gym =>
            gym.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGyms(filtered);
    }, [searchTerm, gyms]);

    const checkLoginStatus = async () => {
        try {
            const response = await fetch(`${serverUrl}/api/auth/session`, {
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

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${serverUrl}/api/brands`);
            setBrands(response.data);
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const handleGymButtonClick = (searchTerm) => {
        setSearchTerm(searchTerm);
    };

    const fetchGyms = async () => {
        await axios.get(`${serverUrl}/api/gyms`, {
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
        window.location.href = `${serverUrl}/oauth2/authorization/kakao`;
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        window.location.href = `${serverUrl}/logout`;
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`${isLoggedIn ? styles.container : styles.ncontainer}`}>
            {isLoggedIn && (
                <>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="클라이밍장 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className={styles.gymButtonScrollContainer}>
                        <div className={styles.gymButtonContainer}>
                            <button
                                className={styles.gymButton}
                                onClick={() => handleGymButtonClick('')}
                            >
                                <span>전체</span>
                            </button>
                            {brands.map((brand, index) => (
                                <button
                                    key={index}
                                    className={styles.gymButton}
                                    onClick={() => handleGymButtonClick(brand.searchTerm)}
                                >
                                    <img src={brand.imageUrl} alt={brand.name} className={styles.gymButtonIcon}/>
                                    <span>{brand.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
            <div className={styles.gymListContainer}>
                <div className={`${styles.gymList} ${!isLoggedIn ? styles.blurred : ''}`}>
                    {filteredGyms.length > 0 ? (
                        filteredGyms.map(gym => (
                            <div key={gym.id} className={styles.gymItem}>
                                <img src={gym.logo} alt={gym.name} className={styles.gymLogo}/>
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
                        ))
                    ) : (
                        <div className={styles.noResults}>검색 중...</div>
                    )}
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
                    {canVote ? (
                        <Link href="/input" className={styles.crowdnessButton}>혼잡도 입력하기</Link>
                    ) : (
                        <p className={styles.cantVoteButton}>오늘은 이미 투표하셨습니다 :)</p>
                    )}
                    {/*<button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button>*/}
                </>
            }
        </div>
    );
}
