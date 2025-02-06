'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MajorSelection() {
    const [selectedMajor, setSelectedMajor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    // 임시 전공 데이터 (추후 API 연동)
    const [majors, setMajors] = useState([
        { id: 1, name: "컴퓨터공학과" },
        { id: 2, name: "전자공학과" },
        { id: 3, name: "기계공학과" },
        { id: 4, name: "화학공학과" },
        { id: 5, name: "산업공학과" },
        // ... 더 많은 전공들
    ]);

    const handleMajorSelect = async () => {
        if (!selectedMajor) {
            setMessage('전공을 선택해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${serverUrl}/api/users/major`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ majorId: selectedMajor }),
            });

            if (response.ok) {
                router.push('/home');
            } else {
                throw new Error('전공 선택에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">전공 선택</h1>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">전공을 선택해주세요</h2>
                        <p className="mt-2 text-gray-600">나중에 마이페이지에서 변경할 수 있습니다.</p>
                    </div>

                    <div className="space-y-2 mb-8">
                        {majors.map((major) => (
                            <div
                                key={major.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedMajor === major.id
                                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                                        : 'hover:bg-gray-50 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedMajor(major.id)}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                        selectedMajor === major.id
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                    }`}>
                                    </div>
                                    <span className={`${
                                        selectedMajor === major.id
                                            ? 'text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}>
                                        {major.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={handleSkip}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
                        >
                            건너뛰기
                        </button>
                        <button
                            onClick={handleMajorSelect}
                            disabled={!selectedMajor || isLoading}
                            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading ? '처리중...' : '선택 완료'}
                        </button>
                    </div>

                    {message && (
                        <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-lg text-center">
                            {message}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}