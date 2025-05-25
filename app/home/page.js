'use client';

import Link from 'next/link';
import { Layout } from '@/app/components/layout';

export default function HomePage() {
    return (
        <Layout requireAuth={true}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* 사용자 맞춤 콘텐츠 섹션 */}
                <UserWelcomeSection />

                {/* 스터디 매칭 CTA 섹션 */}
                <HeroSection />

                {/* 주요 기능 소개 */}
                <FeatureCards />

                {/* 인기 카테고리 */}
                <CategorySection />
            </div>
        </Layout>
    );
}

// 사용자 환영 섹션 컴포넌트
function UserWelcomeSection() {
    // userData는 Layout에서 관리하므로 여기서는 표시만
    // 실제로는 Layout에서 props로 받아와야 함 (추후 개선)
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    맞춤 스터디 추천
                </h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-700">
                        대학 인증을 완료하면 더 정확한 스터디 추천을 받을 수 있어요.
                    </p>
                    <Link
                        href="/university-certification"
                        className="mt-2 inline-block text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-200"
                    >
                        대학 인증하기 →
                    </Link>
                </div>
            </div>
        </div>
    );
}

// 히어로 섹션 컴포넌트
function HeroSection() {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600">
                <h2 className="text-3xl font-bold text-white mb-2">
                    스터디를 찾고 계신가요?
                </h2>
                <p className="text-indigo-100 text-lg max-w-2xl mb-6">
                    Stitch와 함께 나에게 딱 맞는 스터디 그룹을 찾아보세요.
                    관심사가 비슷한 사람들과 함께 공부하고 성장할 수 있습니다.
                </p>
                <Link href="/study">
                    <button className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors duration-200">
                        스터디 매칭 시작하기
                    </button>
                </Link>
            </div>
        </div>
    );
}

// 주요 기능 카드 컴포넌트
function FeatureCards() {
    const features = [
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            title: "스터디 검색",
            description: "관심 분야, 지역, 일정에 맞는 스터디 그룹을 쉽게 찾아보세요.",
            borderColor: "border-indigo-500",
            bgColor: "bg-indigo-100"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "매칭 시스템",
            description: "AI 기반 매칭 시스템으로 나와 잘 맞는 스터디 그룹을 추천받으세요.",
            borderColor: "border-purple-500",
            bgColor: "bg-purple-100"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            title: "일정 관리",
            description: "스터디 일정을 편리하게 관리하고 알림을 받아보세요.",
            borderColor: "border-blue-500",
            bgColor: "bg-blue-100"
        }
    ];

    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 기능</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 ${feature.borderColor}`}
                    >
                        <div className={`w-12 h-12 ${feature.bgColor} rounded-full flex items-center justify-center mb-4`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                        <p className="mt-2 text-gray-600">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 카테고리 섹션 컴포넌트
function CategorySection() {
    const categories = [
        { name: "프로그래밍", color: "bg-indigo-100 text-indigo-700" },
        { name: "외국어", color: "bg-purple-100 text-purple-700" },
        { name: "자격증", color: "bg-blue-100 text-blue-700" },
        { name: "취업준비", color: "bg-pink-100 text-pink-700" },
        { name: "독서", color: "bg-green-100 text-green-700" },
        { name: "투자/재테크", color: "bg-yellow-100 text-yellow-700" }
    ];

    const handleCategoryClick = (categoryName) => {
        // 카테고리별 스터디 목록으로 이동
        window.location.href = `/study?category=${encodeURIComponent(categoryName)}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">인기 스터디 카테고리</h2>
            <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                    <button
                        key={index}
                        onClick={() => handleCategoryClick(category.name)}
                        className={`px-4 py-2 ${category.color} rounded-full font-medium hover:scale-105 transition-transform duration-200 cursor-pointer`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
}