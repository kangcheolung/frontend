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
    const [hasChecked, setHasChecked] = useState(false); // 추가: 중복 체크 방지
    const router = useRouter();

    // 서버 URL 명시적으로 설정
    const serverUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        if (!hasChecked) { // 추가: 한 번만 체크하도록
            checkLoginAndLoadUserData();
        }
    }, [hasChecked]); // 의존성 배열 수정

    // 로그인 체크 및 사용자 데이터 로드
    const checkLoginAndLoadUserData = async () => {
        if (hasChecked) return; // 추가: 중복 실행 방지

        try {
            setHasChecked(true); // 추가: 체크 완료 표시

            console.log('Checking login status...'); // 디버깅용

            // 로그인 상태 확인
            const response = await fetch(`${serverUrl}/api/auth/session`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Session check failed');
            }

            const data = await response.json();
            console.log('Session response:', data); // 디버깅용

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
            setHasChecked(true); // 에러시에도 체크 완료 표시
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
            console.log('Fetching user data...'); // 디버깅용

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
            console.log('User data response:', userData); // 디버깅용

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