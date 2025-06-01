// components/study/StudyCard.js
'use client';

import { Calendar, Clock } from 'lucide-react';

export default function StudyCard({ study, getCategoryFromContent }) {
    // 스터디 상태 스타일
    const getStatusStyle = (status) => {
        switch (status) {
            case 'RECRUITING':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'RECRUITING': return '모집중';
            case 'IN_PROGRESS': return '진행중';
            case 'COMPLETED': return '완료';
            default: return '알 수 없음';
        }
    };

    // 태그 생성 (content에서 키워드 추출)
    const generateTags = (title, content) => {
        const keywords = [];
        const text = (title + ' ' + content).toLowerCase();

        if (text.includes('토익')) keywords.push('토익');
        if (text.includes('영어')) keywords.push('영어');
        if (text.includes('react')) keywords.push('React');
        if (text.includes('개발') || text.includes('프로그래밍')) keywords.push('개발');
        if (text.includes('자격증')) keywords.push('자격증');
        if (text.includes('독서')) keywords.push('독서');
        if (text.includes('온라인')) keywords.push('온라인');
        if (text.includes('오프라인')) keywords.push('오프라인');

        return keywords.slice(0, 4); // 최대 4개까지
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString; // 파싱 실패 시 원본 반환
        }
    };

    // 스터디 상세 페이지로 이동
    const handleStudyClick = () => {
        console.log('StudyCard 클릭:', study); // 디버깅용
        console.log('스터디 ID:', study.id); // ID 확인용
        window.location.href = `/study/${study.id}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-indigo-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 flex flex-col flex-grow">
                {/* 상태 배지와 카테고리 */}
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusStyle(study.studyStatus)}`}>
                        {getStatusText(study.studyStatus)}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {getCategoryFromContent(study.content)}
                    </span>
                </div>

                {/* 제목 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {study.title}
                </h3>

                {/* 내용 */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {study.content}
                </p>

                {/* 메타 정보 */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>생성일: {formatDate(study.createdAt)}</span>
                    </div>
                    {study.updatedAt !== study.createdAt && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>수정일: {formatDate(study.updatedAt)}</span>
                        </div>
                    )}
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1 mb-6">
                    {generateTags(study.title, study.content).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* 자세히 보기 버튼 - 하단 고정 */}
                <div className="mt-auto">
                    <button
                        onClick={handleStudyClick}
                        className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                        자세히 보기 →
                    </button>
                </div>
            </div>
        </div>
    );
}