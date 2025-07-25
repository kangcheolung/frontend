// app/study/page.js - Suspense 적용으로 useSearchParams 에러 해결
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import StudySearchHeader from '@/app/components/study/StudySearchHeader';
import StudyCard from '@/app/components/study/StudyCard';
import { Plus, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

function StudyContent() {
    const searchParams = useSearchParams();
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '전체');
    const [sortBy, setSortBy] = useState('latest');

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    const sortOptions = [
        { value: 'latest', label: '최신순' },
        { value: 'popular', label: '인기순' },
        { value: 'deadline', label: '마감임박순' },
        { value: 'member', label: '참여자 많은순' }
    ];

    // 스터디 목록 조회 API - 백엔드와 일치하도록 수정
    const fetchStudies = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('API 호출 시작: /api/studies/list');

            const response = await fetch(`${serverUrl}/api/studies/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include', // 인증 쿠키 포함
            });

            console.log('API 응답 상태:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.code === 'SUCCESS') {
                // 백엔드 응답: CommonResponse<List<StudyPostListResponse>>
                const studyData = data.data || data.result || [];
                setStudies(studyData);
                console.log('스터디 데이터:', studyData);

                if (studyData.length > 0) {
                    console.log('첫 번째 스터디 구조:', studyData[0]);
                    console.log('ID 확인:', studyData[0].id);
                }
            } else {
                throw new Error(data.message || '스터디 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 목록 조회 실패:', error);
            setError(error.message);
            setStudies([]);
        } finally {
            setLoading(false);
        }
    };

    // 스터디 검색 API - 백엔드 엔드포인트와 일치
    const searchStudies = async (keyword) => {
        if (!keyword.trim()) {
            await fetchStudies();
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('검색 API 호출:', keyword);

            const response = await fetch(`${serverUrl}/api/studies/search?keyword=${encodeURIComponent(keyword)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            console.log('검색 API 응답 상태:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('검색 API Response:', data);

            if (data.code === 'SUCCESS') {
                const studyData = data.data || data.result || [];
                setStudies(studyData);
                console.log('검색 결과:', studyData);
            } else {
                throw new Error(data.message || '스터디 검색에 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 검색 실패:', error);
            setError(error.message);
            setStudies([]);
        } finally {
            setLoading(false);
        }
    };

    // 검색 디바운스
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchKeyword.trim()) {
                searchStudies(searchKeyword);
            } else {
                fetchStudies();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchStudies();
    }, []);

    // 카테고리 매핑 (UI 표시용)
    const getCategoryFromContent = (content) => {
        if (content.includes('토익') || content.includes('영어') || content.includes('외국어')) return '외국어';
        if (content.includes('React') || content.includes('프로그래밍') || content.includes('개발')) return '프로그래밍';
        if (content.includes('자격증') || content.includes('기사')) return '자격증';
        if (content.includes('독서') || content.includes('책')) return '독서';
        if (content.includes('취업') || content.includes('면접')) return '취업준비';
        return '기타';
    };

    // 필터링 및 정렬 로직
    const getFilteredAndSortedStudies = () => {
        let filtered = [...studies];

        // 검색 키워드 필터 (클라이언트 사이드)
        if (searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase();
            filtered = filtered.filter(study =>
                study.title?.toLowerCase().includes(keyword) ||
                study.content?.toLowerCase().includes(keyword)
            );
        }

        // 카테고리 필터
        if (selectedCategory !== '전체') {
            filtered = filtered.filter(study => {
                const category = getCategoryFromContent(study.content);
                return category === selectedCategory;
            });
        }

        // 정렬 (API 데이터 기준으로 수정)
        switch (sortBy) {
            case 'latest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'popular':
                filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
            case 'deadline':
                filtered.sort((a, b) => {
                    if (a.studyStatus === 'RECRUITING' && b.studyStatus !== 'RECRUITING') return -1;
                    if (a.studyStatus !== 'RECRUITING' && b.studyStatus === 'RECRUITING') return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
            case 'member':
                filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
        }

        return filtered;
    };

    const filteredStudies = getFilteredAndSortedStudies();

    return (
        <Layout requireAuth={false}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 검색 헤더 컴포넌트 */}
                <StudySearchHeader
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOptions={sortOptions}
                    studyCount={filteredStudies.length}
                />

                {/* 에러 상태 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-800">
                                <h3 className="font-medium">오류가 발생했습니다</h3>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchStudies}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* 로딩 상태 */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-600">로딩 중...</span>
                    </div>
                ) : (
                    <>
                        {/* 스터디 목록 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {filteredStudies.length > 0 ? (
                                filteredStudies.map((study) => (
                                    <StudyCard
                                        key={study.id}
                                        study={study}
                                        getCategoryFromContent={getCategoryFromContent}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchKeyword.trim() || selectedCategory !== '전체'
                                            ? '검색 결과가 없습니다'
                                            : '등록된 스터디가 없습니다'
                                        }
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {searchKeyword.trim() || selectedCategory !== '전체'
                                            ? '다른 조건으로 검색해보세요'
                                            : '첫 번째 스터디를 만들어보세요'
                                        }
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/study/create'}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                                    >
                                        스터디 만들기
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 스터디 생성 플로팅 버튼 */}
                <button
                    onClick={() => window.location.href = '/study/create'}
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </Layout>
    );
}

export default function StudyListPage() {
    return (
        <Suspense fallback={
            <Layout requireAuth={false}>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-600">페이지 로딩 중...</span>
                    </div>
                </div>
            </Layout>
        }>
            <StudyContent />
        </Suspense>
    );
}