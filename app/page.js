'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from './page.module.css';
import { useSession } from "next-auth/react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [brands, setBrands] = useState([]);
    const [gyms, setGyms] = useState([]);
    const [filteredGyms, setFilteredGyms] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
    const [canVote, setCanVote] = useState(true);
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    useEffect(() => {
        checkLoginStatus();
    }, []);

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

    const handleKakaoLogin = () => {
        window.location.href = `${serverUrl}/oauth2/authorization/kakao`;

    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        window.location.href = `${serverUrl}/logout`;
    };

    return (
        <div>
            {isLoading ? (
                <p>Loading...</p>
            ) : isLoggedIn ? (
                <button onClick={handleLogout}>로그아웃</button>
            ) : (
                <button onClick={handleKakaoLogin} className={styles.kakaoLoginButton}>
                    카카오 로그인
                </button>
            )}
            {/* 여기에 나머지 컴포넌트 내용을 추가하세요 */}
        </div>
    );
}