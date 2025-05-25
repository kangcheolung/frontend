// components/study/StudySearchHeader.js
'use client';

import { Search, Filter } from 'lucide-react';

export default function StudySearchHeader({
                                              searchKeyword,
                                              setSearchKeyword,
                                              selectedCategory,
                                              setSelectedCategory,
                                              sortBy,
                                              setSortBy,
                                              sortOptions,
                                              studyCount
                                          }) {
    const categories = ['전체', '프로그래밍', '외국어', '자격증', '취업준비', '독서', '투자/재테크'];

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">스터디 찾기</h1>
            <p className="text-gray-600 mb-6">
                나에게 딱 맞는 스터디를 찾아보세요. 함께 성장할 동료들이 기다리고 있어요!
            </p>

            {/* 검색바 */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="스터디명, 내용으로 검색해보세요"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                            selectedCategory === category
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* 정렬 및 필터 옵션 */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-gray-600">
                    총 {studyCount}개의 스터디
                </p>
            </div>
        </div>
    );
}