'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UniversityCertification() {
    const [email, setEmail] = useState('');
    const [univName, setUnivName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState('initial');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageType, setMessageType] = useState('error'); // 'error' or 'success'

    const router = useRouter();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    const handleSendVerification = async () => {
        if (!email || !univName) {
            setMessage('이메일과 대학교 이름을 모두 입력해주세요.');
            setMessageType('error');
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
                body: JSON.stringify({ email, univName, univ_check: true }),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                if (data.success) {
                    setStep('emailSent');
                    setMessage('인증 이메일이 발송되었습니다. 메일함을 확인해주세요. (스팸 메일함도 확인해주세요.)');
                    setMessageType('success');
                } else {
                    setMessage(data.message || '인증 이메일 발송에 실패했습니다.');
                    setMessageType('error');
                }
            } else {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('학교명과 이메일을 확인해주세요.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            setMessage('인증 코드를 입력해주세요.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${serverUrl}/api/auth/university/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, univName, code: verificationCode }),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                if (data.success) {
                    setStep('verified');
                    setMessage('인증이 완료되었습니다!');
                    setMessageType('success');
                    // 잠시 대기 후 전공 선택 페이지로 이동
                    setTimeout(() => {
                        router.push('/major-selection');
                    }, 1500);
                } else {
                    setMessage(data.message || '인증 코드 확인에 실패했습니다.');
                    setMessageType('error');
                }
            } else {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(`오류가 발생했습니다: ${error.message}`);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        router.push('/mypage');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Link href="/home" className="flex items-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Stitch</h1>
                        <span className="ml-3 text-gray-500 text-sm">스터디 매칭 플랫폼</span>
                    </Link>
                    <Link href="/mypage" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        마이페이지로 돌아가기
                    </Link>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-500 to-purple-600">
                            <h2 className="text-2xl font-bold text-white">대학교 인증</h2>
                            <p className="text-indigo-100 mt-2">
                                대학교 인증을 통해 스터디 매칭 서비스를 이용해보세요.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8">
                            {/* Progress indicator */}
                            <div className="flex items-center mb-8">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'initial' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'} font-bold`}>1</div>
                                <div className={`flex-1 h-1 mx-2 ${step === 'initial' ? 'bg-gray-200' : 'bg-indigo-600'}`}></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'emailSent' ? 'bg-indigo-600 text-white' : (step === 'verified' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500')} font-bold`}>2</div>
                                <div className={`flex-1 h-1 mx-2 ${step === 'verified' ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'verified' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'} font-bold`}>3</div>
                            </div>

                            {/* Step labels */}
                            <div className="flex justify-between text-xs text-gray-500 mb-6 px-1">
                                <span>인증 요청</span>
                                <span>코드 확인</span>
                                <span>인증 완료</span>
                            </div>

                            {step === 'initial' && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">대학교 이메일</label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="university@edu.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="univName" className="block text-sm font-medium text-gray-700 mb-1">대학교 이름</label>
                                        <input
                                            id="univName"
                                            type="text"
                                            placeholder="OO대학교"
                                            value={univName}
                                            onChange={(e) => setUnivName(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendVerification}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition duration-200 font-medium disabled:opacity-70"
                                    >
                                        {isLoading ? '전송 중...' : '인증 메일 전송'}
                                    </button>
                                </div>
                            )}

                            {step === 'emailSent' && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                        <p className="text-indigo-800 text-sm">
                                            <span className="font-medium block">인증 이메일이 발송되었습니다!</span>
                                            입력하신 이메일({email})로 전송된 코드를 확인해주세요.
                                        </p>
                                    </div>
                                    <div>
                                        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">인증 코드</label>
                                        <input
                                            id="verificationCode"
                                            type="text"
                                            placeholder="인증 코드 입력"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleVerifyCode}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition duration-200 font-medium disabled:opacity-70"
                                    >
                                        {isLoading ? '확인 중...' : '인증 코드 확인'}
                                    </button>
                                </div>
                            )}

                            {step === 'verified' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">대학교 인증 완료!</h3>
                                    <p className="text-gray-600">잠시 후 전공 선택 페이지로 이동합니다.</p>
                                </div>
                            )}

                            {message && (
                                <div className={`mt-4 p-3 rounded-lg ${messageType === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {message}
                                </div>
                            )}

                            {step !== 'verified' && (
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={goBack}
                                        className="text-gray-600 hover:text-indigo-600 text-sm"
                                    >
                                        마이페이지로 돌아가기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-indigo-900 text-indigo-100 py-8 mt-auto">
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