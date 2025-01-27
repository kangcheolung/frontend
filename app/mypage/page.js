'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyPage() {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    useEffect(() => {
        checkLoginStatus();
        fetchUserData();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const response = await fetch(`${serverUrl}/api/auth/session`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.result.isLoggedIn) {
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to check login status', error);
            router.push('/');
        }
    };

    const fetchUserData = async () => {
        try {
            // API 엔드포인트는 실제 백엔드 구현에 맞게 수정해야 합니다
            const response = await fetch(`${serverUrl}/api/user/profile`, {
                credentials: 'include'
            });
            const data = await response.json();
            setUserData(data);
        } catch (error) {
            console.error('Failed to fetch user data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        window.location.href = `${serverUrl}/logout`;
    };

    const handleUnivCert = () => {
        router.push('/university-certification');
    };

    if (isLoading) {
        return <div className="text-2xl text-gray-600 text-center mt-10">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Link href="/home" className="text-3xl font-bold text-gray-900">
                        Our App
                    </Link>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">마이페이지</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
                    <div className="border-b border-gray-200 pb-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">내 정보</h2>
                        {userData && (
                            <div className="mt-4">
                                <p className="text-gray-600">이메일: {userData.email}</p>
                                <p className="text-gray-600">이름: {userData.name}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleUnivCert}
                            className="w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                        >
                            대학교 인증하기
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full sm:w-auto bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200 ml-0 sm:ml-4"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-800 text-white py-4 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>&copy; 2024 Our App. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}