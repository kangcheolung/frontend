// components/layout/Header.js
'use client';

import Link from 'next/link';
import { NotificationBell } from '../NotificationBell';

export default function Header({ userData, isLoading }) {
    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            Stitch
                        </h1>
                        <span className="ml-3 text-gray-500 text-sm">스터디 매칭 플랫폼</span>
                    </Link>
                </div>

                <nav className="flex items-center space-x-6">
                    <Link
                        href="/study"
                        className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
                    >
                        스터디 찾기
                    </Link>

                    {/* 로그인된 사용자만 표시되는 링크들 */}
                    {userData && (
                        <>
                            <Link
                                href="/my-studies"
                                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-200"
                            >
                                내 스터디
                            </Link>
                            <Link
                                href="/study/create"
                                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium transition-colors duration-200"
                            >
                                스터디 만들기
                            </Link>
                        </>
                    )}

                    <div className="flex items-center space-x-4">
                        {/* 알림 벨 - 로그인된 사용자에게만 표시 */}
                        {userData && !isLoading && <NotificationBell />}

                        {isLoading ? (
                            <div className="animate-pulse flex items-center">
                                <div className="h-4 bg-gray-300 rounded w-20 mr-4"></div>
                                <div className="h-8 bg-gray-300 rounded-full w-20"></div>
                            </div>
                        ) : userData ? (
                            <>
                                <span className="mr-4 text-gray-700">
                                    안녕하세요, {userData.name || userData.nickname || '사용자'}님!
                                </span>
                                <Link
                                    href="/mypage"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors duration-200"
                                >
                                    마이페이지
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors duration-200"
                            >
                                로그인
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}