'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { cacheUserData, isUserCached, getCachedUserData } from '@/app/services/userCache';
import { NotificationProvider } from '@/app/contexts/NotificationContext';

export default function Layout({ children, requireAuth = false }) {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const router = useRouter();

    // 서버 URL 명시적으로 설정
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    useEffect(() => {
        if (!hasChecked) {
            checkLoginAndLoadUserData();
        }
    }, []);

    // 로그인 체크 및 사용자 데이터 로드
    const checkLoginAndLoadUserData = async () => {
        if (hasChecked) return;

        try {
            setHasChecked(true);

            console.log('Checking login status...');

            // 로그인 상태 확인
            const response = await fetch(`${serverUrl}/api/auth/session`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Session check failed');
            }

            const data = await response.json();
            console.log('Session response:', data);

            setIsLoggedIn(data.result?.isLoggedIn || false);

            if (!data.result?.isLoggedIn) {
                if (requireAuth) {
                    router.push('/');
                    return;
                }
                setIsLoading(false);
                return;
            }

            // 캐시에 사용자 정보가 있는지 확인
            if (isUserCached()) {
                const cachedUser = getCachedUserData();
                setUserData(cachedUser);
                setIsLoading(false);
                console.log('User data loaded from cache:', cachedUser);
            } else {
                // 캐시에 없으면 API에서 가져오기
                await fetchAndCacheUserData();
            }
        } catch (error) {
            console.error('Failed to check login status or load user data', error);
            setHasChecked(true);
            setIsLoggedIn(false);
            if (requireAuth) {
                router.push('/');
            } else {
                setIsLoading(false);
            }
        }
    };

    // 사용자 정보 가져와서 캐싱
    const fetchAndCacheUserData = async () => {
        try {
            console.log('Fetching user data...');

            const userResponse = await fetch(`${serverUrl}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            if (!userResponse.ok) {
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
            }

            const userData = await userResponse.json();
            console.log('User data response:', userData);

            if (userData.code === 'SUCCESS' && userData.result) {
                // 사용자 정보 캐시에 저장 및 상태 업데이트
                cacheUserData(userData.result);
                setUserData(userData.result);
                console.log('User data fetched and cached:', userData.result);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 로딩 상태 표시
    if (isLoading && requireAuth) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-2xl text-indigo-600 font-medium">Loading...</div>
            </div>
        );
    }

    // 알림 시스템은 로그인된 사용자에게만 제공
    const shouldProvideNotifications = isLoggedIn && userData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            {shouldProvideNotifications ? (
                <NotificationProvider>
                    <Header userData={userData} isLoading={isLoading} />
                    <main className="min-h-[calc(100vh-200px)]">
                        {children}
                    </main>
                    <Footer />
                </NotificationProvider>
            ) : (
                <>
                    <Header userData={userData} isLoading={isLoading} />
                    <main className="min-h-[calc(100vh-200px)]">
                        {children}
                    </main>
                    <Footer />
                </>
            )}
        </div>
    );
}