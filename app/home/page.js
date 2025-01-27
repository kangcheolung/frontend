'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
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
            if (!data.result.isLoggedIn) {
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to check login status', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-2xl text-gray-600 text-center mt-10">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Our App</h1>
                    <Link href="/mypage" className="text-blue-600 hover:text-blue-800">
                        마이페이지
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">홈페이지</h2>
                    <p className="text-gray-600">
                        환영합니다! 이곳에서 다양한 기능을 이용하실 수 있습니다.
                    </p>

                    {/* 여기에 홈페이지의 주요 컨텐츠를 추가하세요 */}
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900">기능 1</h3>
                            <p className="mt-2 text-gray-600">기능 1에 대한 설명입니다.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900">기능 2</h3>
                            <p className="mt-2 text-gray-600">기능 2에 대한 설명입니다.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900">기능 3</h3>
                            <p className="mt-2 text-gray-600">기능 3에 대한 설명입니다.</p>
                        </div>
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