'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import styles from './page.module.css';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
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
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome to Our App</h1>
            </header>
            <main className={styles.main}>
                {isLoading ? (
                    <div className={styles.loader}>Loading...</div>
                ) : (
                    <div className={styles.content}>
                        {isLoggedIn ? (
                            <>
                                <p className={styles.welcomeMessage}>Welcome back!</p>
                                <button onClick={handleLogout} className={styles.logoutButton}>
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <p className={styles.loginMessage}>Please log in to continue</p>
                                <button onClick={handleKakaoLogin} className={styles.kakaoLoginButton}>
                                    Login with Kakao
                                </button>
                            </>
                        )}
                    </div>
                )}
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2024 Our App. All rights reserved.</p>
            </footer>
        </div>
    );
}