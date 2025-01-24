'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UniversityCertification() {
    const [email, setEmail] = useState('');
    const [univName, setUnivName] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
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
                body: JSON.stringify({ email, univName, univ_check: true }),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                if (data.success) {
                    setStep('emailSent');
                    setMessage('인증 이메일이 발송되었습니다. 메일함을 확인해주세요. (스팸 메일함도 확인해주세요.)');
                } else {
                    setMessage(data.message || '인증 이메일 발송에 실패했습니다.');
                }
            } else {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(`학교명과 이메일을 확인해주세요.`);
        } finally {
            setIsLoading(false);
        }
    };
    const handleVerifyCode = async () => {
        if (!verificationCode) {
            setMessage('인증 코드를 입력해주세요.');
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
                    setMessage(`인증이 완료되었습니다! 인증된 이메일: ${data.certified_email}`);
                } else {
                    setMessage(data.message || '인증 코드 확인에 실패했습니다.');
                }
            } else {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">University Certification</h1>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    {step === 'initial' && (
                        <>
                            <input
                                type="email"
                                placeholder="University Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="University Name"
                                value={univName}
                                onChange={(e) => setUnivName(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <button
                                onClick={handleSendVerification}
                                disabled={isLoading}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                            >
                                {isLoading ? 'Sending...' : 'Send Verification Email'}
                            </button>
                        </>
                    )}
                    {step === 'emailSent' && (
                        <>
                            <input
                                type="text"
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <button
                                onClick={handleVerifyCode}
                                disabled={isLoading}
                                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200 disabled:bg-green-300"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </>
                    )}
                    {step === 'verified' && (
                        <p className="text-xl text-green-600">Your university email has been verified!</p>
                    )}
                    {message && <p className="mt-4 text-red-500">{message}</p>}
                </div>
            </main>
        </div>
    );
}