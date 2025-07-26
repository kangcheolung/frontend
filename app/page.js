'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cacheUserData, isUserLoggedIn } from '@/app/services/userCache';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    useEffect(() => {
        // 페이지 로드 시 로그인 상태 확인
        checkLoginStatus();

        // 카카오 로그인 콜백 처리
        handleKakaoCallback();
    }, []);

    const checkLoginStatus = async () => {
        try {
            // 먼저 캐시에서 로그인 상태 확인
            if (isUserLoggedIn()) {
                setIsLoggedIn(true);
                router.push('/home');
                return;
            }

            // 캐시에 없으면 서버에 확인
            const response = await fetch(`${serverUrl}/api/users/session`, {
                credentials: 'include'
            });
            const data = await response.json();

            setIsLoggedIn(data.result.isLoggedIn);

            if (data.result.isLoggedIn) {
                // 로그인 되어 있다면 사용자 정보 가져와서 캐싱
                await fetchAndCacheUserData();
                router.push('/home');
            }
        } catch (error) {
            console.error('Failed to check login status', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 카카오 로그인 콜백 처리 함수
    const handleKakaoCallback = async () => {
        // URL 파라미터에서 인증 코드 확인
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode) {
            setIsLoading(true);
            try {
                // 인증 코드로 로그인 처리 (이 부분은 백엔드에서 대부분 처리)
                // 사용자 정보 가져오기
                await fetchAndCacheUserData();

                // 홈 페이지로 이동
                router.push('/home');
            } catch (error) {
                console.error('Failed to process Kakao login', error);
                setIsLoading(false);
            }
        }
    };

    // 사용자 정보 가져와서 캐싱하는 함수
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
                console.log('User data fetched:', userData.result);
                // 사용자 정보 캐시에 저장
                cacheUserData(userData.result);
                console.log('User data fetched and cached successfully');
                return userData.result;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };

    const handleKakaoLogin = () => {
        window.location.href = `${serverUrl}/oauth2/authorization/kakao`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-2xl text-indigo-600 font-medium">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-blue-50">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Stitch</h1>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {/* Image Banner */}
                        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center p-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">스티치에 오신 것을 환영합니다</h2>
                                <p className="text-indigo-100">함께 배우고 성장하는 스터디 매칭 플랫폼</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">로그인</h3>
                                <p className="text-gray-600">스티치에 로그인하고 스터디 그룹을 찾아보세요.</p>
                            </div>

                            <button
                                onClick={handleKakaoLogin}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition duration-200 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                                    <path fill="currentColor" d="M12,3C17.5,3,22,6.58,22,11c0,4.42-4.5,8-10,8c-0.59,0-1.17-0.04-1.73-0.12L6.2,21.83c-0.39,0.39-1.02,0.39-1.41,0 c-0.19-0.19-0.3-0.44-0.3-0.71v-4.88C3.2,14.85,2,13.03,2,11C2,6.58,6.5,3,12,3z" />
                                </svg>
                                카카오 로그인
                            </button>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-center">
                                    <span className="text-sm text-gray-500 text-center">회원이 아니신가요?<br />카카오 계정으로 간편하게 가입하실 수 있습니다.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            <span className="text-indigo-600 font-medium">Stitch</span>는 스터디와 매치의 결합으로<br />최적의 스터디 그룹을 찾아드립니다.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="bg-indigo-900 text-indigo-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-2xl font-bold text-white mb-2">Stitch</h2>
                            <p className="text-indigo-200">스터디와 매치의 만남, 스티치</p>
                        </div>
                        <div className="flex space-x-6">
                            <a href="#" className="text-indigo-200 hover:text-white">서비스 소개</a>
                            <a href="#" className="text-indigo-200 hover:text-white">이용약관</a>
                            <a href="#" className="text-indigo-200 hover:text-white">개인정보처리방침</a>
                            <a href="#" className="text-indigo-200 hover:text-white">고객센터</a>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-indigo-800 pt-6 text-center text-indigo-300">
                        <p>&copy; 2024 Stitch. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}