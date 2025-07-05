'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCachedUserData, isUserCached, clearUserCache, cacheUserData } from '@/app/services/userCache';

export default function MyPage() {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    useEffect(() => {
        initializeUser();
    }, []);

    const initializeUser = async () => {
        try {
            // 캐시에서 먼저 사용자 정보 확인
            if (isUserCached()) {
                const cachedUser = getCachedUserData();
                setUserData(cachedUser);

                // 캐시가 있더라도 최신 정보를 가져와서 업데이트 (백그라운드)
                refreshUserData();
            } else {
                // 캐시에 없으면 로그인 체크
                const sessionResponse = await fetch(`${serverUrl}/api/auth/session`, {
                    credentials: 'include'
                });
                const sessionData = await sessionResponse.json();

                if (!sessionData.result.isLoggedIn) {
                    router.push('/');
                    return;
                }

                // 로그인 되어있다면 유저 데이터 가져오기
                await fetchAndCacheUserData();
            }
        } catch (error) {
            console.error('Failed to initialize user:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    // 백그라운드에서 최신 사용자 정보 가져오기
    const refreshUserData = async () => {
        try {
            await fetchAndCacheUserData();
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            // 실패해도 기존 캐시 데이터로 UI 유지 (사용자 경험 보호)
        }
    };

    // 사용자 정보 가져와서 캐싱 및 상태 업데이트
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
                // 캐시 업데이트
                cacheUserData(userData.result);

                // UI 업데이트
                setUserData(userData.result);
                console.log('User data refreshed from API:', userData.result);
                return userData.result;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    };

    const handleLogout = () => {
        // 로그아웃 시 캐시 삭제
        clearUserCache();
        window.location.href = `${serverUrl}/api/users/logout`;
    };

    const handleUnivCert = () => {
        router.push('/university-certification');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-2xl text-indigo-600 font-medium">Loading...</div>
            </div>
        );
    }

    // 사용자 데이터가 없는 경우 처리
    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <div className="text-xl text-red-600 font-medium mb-4">사용자 정보를 불러올 수 없습니다</div>
                    <p className="text-gray-600 mb-6">로그인이 필요하거나 세션이 만료되었을 수 있습니다.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        로그인 페이지로 이동
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Link href="/home" className="flex items-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Stitch</h1>
                        <span className="ml-3 text-gray-500 text-sm">스터디 매칭 플랫폼</span>
                    </Link>
                    <div className="flex items-center">
                        <span className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium">마이페이지</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <h2 className="text-3xl font-bold text-white">내 정보</h2>
                        <p className="text-indigo-100 mt-2">내 프로필 및 인증 상태를 확인하고 관리할 수 있습니다.</p>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex">
                                            <div className="w-24 text-gray-500">이메일</div>
                                            <div className="font-medium text-gray-900">{userData.email || '-'}</div>
                                        </div>
                                        <div className="flex">
                                            <div className="w-24 text-gray-500">이름</div>
                                            <div className="font-medium text-gray-900">{userData.name || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">인증 정보</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <div className="w-24 text-gray-500">인증 상태</div>
                                            <div className="flex items-center">
                                                {userData.campusCertified ? (
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                        <span className="text-green-600 font-medium">인증 완료</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                                                        <span className="text-amber-600 font-medium">미인증</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {userData.campusCertified
                                                ? '대학교 인증이 완료되었습니다. 추가 인증 정보를 관리할 수 있습니다.'
                                                : '대학교 인증을 완료하면 더 많은 스터디 그룹에 참여할 수 있습니다.'}
                                        </p>
                                    </div>
                                </div>

                                {userData.campusCertified && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">대학 정보</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex">
                                                <div className="w-24 text-gray-500">대학교</div>
                                                <div className="font-medium text-gray-900">
                                                    {userData.campusName || '-'}
                                                </div>
                                            </div>
                                            <div className="flex">
                                                <div className="w-24 text-gray-500">전공</div>
                                                <div className="font-medium text-gray-900">
                                                    {userData.majorName || '전공 미설정'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">내 활동</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                                <div className="text-3xl font-bold text-indigo-600">
                                                    {userData.joinedStudyCount || 0}
                                                </div>
                                                <div className="text-gray-500 text-sm">참여중인 스터디</div>
                                            </div>
                                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {userData.pendingStudyCount || 0}
                                                </div>
                                                <div className="text-gray-500 text-sm">승인 대기 스터디</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 관리</h3>
                                    <div className="space-y-3">
                                        {userData.campusCertified ? (
                                            <Link href="/major-selection"
                                                  className="block w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition duration-200 text-center font-medium">
                                                전공 선택 및 변경
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={handleUnivCert}
                                                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition duration-200 font-medium"
                                            >
                                                대학교 인증하기
                                            </button>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full border border-red-500 text-red-500 py-3 px-4 rounded-lg hover:bg-red-50 transition duration-200"
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
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