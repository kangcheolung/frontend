'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UniversityCertification() {
    const [email, setEmail] = useState('');
    const [univName, setUnivName] = useState('');
    const [step, setStep] = useState('initial');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    const handleSendVerification = async () => {
        if (!email || !univName) {
            setMessage('이메일과 대학교 이름을 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${serverUrl}/api/auth/university/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, univName }),
            });

            const data = await response.json();
            console.log('서버 응답:', data);

            if (response.ok && data.code === 200) {
                setStep('verified');
                setMessage('인증되었습니다!');
            } else {
                setMessage(data.message || '인증에 실패했습니다.');
            }
        } catch (error) {
            console.error('오류:', error);
            setMessage('이메일과 대학 이름을 정확히 입력해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoHome = () => {
        router.push('/');  // 홈 페이지 경로로 수정해주세요
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">대학 인증</h1>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    {step === 'initial' && (
                        <>
                            <input
                                type="email"
                                placeholder="대학 이메일"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="대학교 이름"
                                value={univName}
                                onChange={(e) => setUnivName(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <button
                                onClick={handleSendVerification}
                                disabled={isLoading}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                            >
                                {isLoading ? '인증 중...' : '인증'}
                            </button>
                        </>
                    )}
                    {step === 'verified' && (
                        <>
                            <p className="text-xl text-green-600 mb-4">인증되었습니다!</p>
                            <button
                                onClick={handleGoHome}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                            >
                                홈으로 돌아가기
                            </button>
                        </>
                    )}
                    {message && <p className="mt-4 text-red-500">{message}</p>}

                </div>
            </main>
        </div>
    );
}