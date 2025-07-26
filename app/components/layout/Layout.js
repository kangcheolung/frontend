'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { cacheUserData, isUserCached, getCachedUserData } from '@/app/services/userCache';

export default function Layout({ children, requireAuth = false }) {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    useEffect(() => {
        checkLoginAndLoadUserData();
    }, []);

    // 로그인 체크 및 사용자 데이터 로드
    const checkLoginAndLoadUserData = async () => {
        try {
            // 로그인 상태 확인
            const response = await fetch(`${serverUrl}/api/auth/session`, {
                credentials: 'include'
            });
            const data = await response.json();

            setIsLoggedIn(data.result.isLoggedIn);

            if (!data.result.isLoggedIn) {
                if (requireAuth) {
                    //router.push('/');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <Header userData={userData} isLoading={isLoading} />
            <main className="min-h-[calc(100vh-200px)]">
                {children}
            </main>
            <Footer />
        </div>
    );
}