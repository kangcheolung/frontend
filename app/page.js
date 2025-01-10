'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    const handleUnivCert = () => {
        router.push('/university-certification');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to Our App</h1>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center">
                {isLoading ? (
                    <div className="text-2xl text-gray-600">Loading...</div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                        {isLoggedIn ? (
                            <>
                                <p className="text-xl text-gray-700 mb-4">Welcome back!</p>
                                <button
                                    onClick={handleUnivCert}
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 mb-4"
                                >
                                    University Certification
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-xl text-gray-700 mb-4">Please log in to continue</p>
                                <button
                                    onClick={handleKakaoLogin}
                                    className="w-full bg-yellow-400 text-gray-900 py-2 px-4 rounded hover:bg-yellow-500 transition duration-200"
                                >
                                    Login with Kakao
                                </button>
                            </>
                        )}
                    </div>
                )}
            </main>
            <footer className="bg-gray-800 text-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>&copy; 2024 Our App. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}