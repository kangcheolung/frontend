'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cacheUserData, isUserCached, getCachedUserData } from '@/app/services/userCache';

export default function HomePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
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

            if (!data.result.isLoggedIn) {
                router.push('/');
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
            router.push('/');
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="text-2xl text-indigo-600 font-medium">Loading...</div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Stitch</h1>
                        <span className="ml-3 text-gray-500 text-sm">스터디 매칭 플랫폼</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/study/search" className="text-indigo-600 hover:text-indigo-800 font-medium">
                            스터디 찾기
                        </Link>
                        <div className="flex items-center">
                            {userData && (
                                <span className="mr-4 text-gray-700">
                                    안녕하세요, {userData.name || userData.nickname || '사용자'}님!
                                </span>
                            )}
                            <Link href="/mypage" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors duration-200">
                                마이페이지
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* 사용자 맞춤 콘텐츠 섹션 */}
                {userData && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {userData.name || userData.nickname || '사용자'}님을 위한 추천
                            </h2>
                            {userData.campusCertified ? (
                                <p className="text-gray-600">
                                    {userData.userCamInfo?.major?.name ?
                                        `${userData.userCamInfo.major.name} 전공자를 위한 맞춤 스터디 추천을 확인해보세요.` :
                                        '전공을 설정하면 더 정확한 스터디 추천을 받을 수 있어요.'}
                                </p>
                            ) : (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-yellow-700">
                                        대학 인증을 완료하면 더 정확한 스터디 추천을 받을 수 있어요.
                                    </p>
                                    <Link href="/university-certification" className="mt-2 inline-block text-indigo-600 font-medium hover:text-indigo-800">
                                        대학 인증하기 →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <h2 className="text-3xl font-bold text-white mb-2">스터디를 찾고 계신가요?</h2>
                        <p className="text-indigo-100 text-lg max-w-2xl">
                            Stitch와 함께 나에게 딱 맞는 스터디 그룹을 찾아보세요. 관심사가 비슷한 사람들과 함께 공부하고 성장할 수 있습니다.
                        </p>
                        <button className="mt-6 px-6 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors duration-200">
                            스터디 매칭 시작하기
                        </button>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 기능</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 border-indigo-500">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">스터디 검색</h3>
                        <p className="mt-2 text-gray-600">관심 분야, 지역, 일정에 맞는 스터디 그룹을 쉽게 찾아보세요.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 border-purple-500">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">매칭 시스템</h3>
                        <p className="mt-2 text-gray-600">AI 기반 매칭 시스템으로 나와 잘 맞는 스터디 그룹을 추천받으세요.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 border-blue-500">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">일정 관리</h3>
                        <p className="mt-2 text-gray-600">스터디 일정을 편리하게 관리하고 알림을 받아보세요.</p>
                    </div>
                </div>

                <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">인기 스터디 카테고리</h2>
                    <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium">프로그래밍</span>
                        <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium">외국어</span>
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">자격증</span>
                        <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full font-medium">취업준비</span>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">독서</span>
                        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-medium">투자/재테크</span>
                    </div>
                </div>
            </main>

            <footer className="bg-indigo-900 text-indigo-100 py-8 mt-12">
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