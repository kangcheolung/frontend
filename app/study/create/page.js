// app/study/create/page.js (생성/수정 통합 페이지)
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { ArrowLeft, Save, X } from 'lucide-react';
import { getCachedUserData } from '@/app/services/userCache';

export default function StudyFormPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        studyStatus: 'RECRUITING'
    });
    const [originalData, setOriginalData] = useState(null);
    const [errors, setErrors] = useState({});

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    // URL에서 수정할 스터디 ID 가져오기
    const editId = searchParams.get('id') || searchParams.get('edit');
    const isEditMode = !!editId;

    // 현재 사용자 정보 가져오기
    const getCurrentUser = () => {
        return getCachedUserData();
    };

    // userCamInfoId 가져오기
    const getUserCamInfoId = () => {
        const user = getCurrentUser();
        if (user?.userCamInfo?.id) {
            return user.userCamInfo.id;
        }
        return 9; // 기본값
    };

    // 수정 모드일 때 기존 데이터 가져오기
    const fetchStudyForEdit = async () => {
        if (!isEditMode) return;

        try {
            setFetchLoading(true);

            const userCamInfoId = getUserCamInfoId();
            console.log(`수정 모드 - 스터디 조회: studyId=${editId}, userCamInfoId=${userCamInfoId}`);

            const response = await fetch(
                `${serverUrl}/api/studies/detail?studyPostId=${editId}&userCamInfoId=${userCamInfoId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('수정용 스터디 상세 응답:', data);

            if (data.code === 'SUCCESS') {
                const studyData = data.data || data.result;

                // 권한 체크 - 작성자만 수정 가능
                const currentUser = getCurrentUser();
                const currentUserCamInfoId = getUserCamInfoId();
                const studyCreatorId = studyData.author?.id || studyData.userCamInfoId;

                if (currentUserCamInfoId !== studyCreatorId) {
                    alert('스터디 작성자만 수정할 수 있습니다.');
                    router.push(`/study/${editId}`);
                    return;
                }

                // 폼 데이터 설정
                const formDataToSet = {
                    title: studyData.title || '',
                    content: studyData.content || '',
                    studyStatus: studyData.studyStatus || 'RECRUITING'
                };

                setFormData(formDataToSet);
                setOriginalData(studyData);
                console.log('수정할 데이터 로드:', formDataToSet);
            } else {
                throw new Error(data.message || '스터디 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('수정용 스터디 조회 실패:', error);
            alert(`스터디 정보를 불러오는데 실패했습니다: ${error.message}`);
            router.push('/study');
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode) {
            fetchStudyForEdit();
        }
    }, [isEditMode, editId]);

    // 입력값 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 에러 메시지 제거
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = '스터디 제목을 입력해주세요.';
        } else if (formData.title.length > 100) {
            newErrors.title = '제목은 100자 이내로 입력해주세요.';
        }

        if (!formData.content.trim()) {
            newErrors.content = '스터디 소개를 입력해주세요.';
        } else if (formData.content.length > 1000) {
            newErrors.content = '소개는 1000자 이내로 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 변경사항 확인 (수정 모드에서만)
    const hasChanges = () => {
        if (!isEditMode || !originalData) return true;

        return formData.title !== originalData.title ||
            formData.content !== originalData.content ||
            formData.studyStatus !== originalData.studyStatus;
    };

    // 스터디 생성/수정 API 호출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (isEditMode && !hasChanges()) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            router.push('/');
            return;
        }

        try {
            setLoading(true);

            const userCamInfoId = getUserCamInfoId();
            const requestData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                studyStatus: formData.studyStatus
            };

            let url, method;
            if (isEditMode) {
                // 수정 API
                url = `${serverUrl}/api/studies/update?studyPostId=${editId}&userCamInfoId=${userCamInfoId}`;
                method = 'POST';
                console.log('스터디 수정 요청:', { editId, requestData, userCamInfoId });
            } else {
                // 생성 API
                url = `${serverUrl}/api/studies/create?userCamInfoId=${userCamInfoId}`;
                method = 'POST';
                console.log('스터디 생성 요청:', { requestData, userCamInfoId });
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`스터디 ${isEditMode ? '수정' : '생성'} 응답:`, data);

            if (data.code === 'SUCCESS') {
                const resultStudy = data.data || data.result;
                const successMessage = isEditMode ? '스터디가 성공적으로 수정되었습니다!' : '스터디가 성공적으로 생성되었습니다!';
                alert(successMessage);

                // 생성된/수정된 스터디 상세 페이지로 이동
                const targetId = isEditMode ? editId : (resultStudy?.id || 'unknown');
                router.push(`/study/${targetId}`);
            } else {
                throw new Error(data.message || `스터디 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`);
            }
        } catch (error) {
            console.error(`스터디 ${isEditMode ? '수정' : '생성'} 실패:`, error);
            alert(`스터디 ${isEditMode ? '수정' : '생성'}에 실패했습니다: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 취소 (뒤로가기)
    const handleCancel = () => {
        const hasUnsavedChanges = isEditMode ? hasChanges() : (formData.title || formData.content);

        if (hasUnsavedChanges) {
            const message = isEditMode ?
                '변경사항이 저장되지 않습니다. 정말 나가시겠습니까?' :
                '작성 중인 내용이 있습니다. 정말 나가시겠습니까?';

            if (confirm(message)) {
                router.back();
            }
        } else {
            router.back();
        }
    };

    // 로딩 상태
    if (fetchLoading) {
        return (
            <Layout requireAuth={true}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p>스터디 정보를 불러오는 중...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout requireAuth={true}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <button
                        onClick={handleCancel}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        돌아가기
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? '스터디 수정' : '새 스터디 만들기'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isEditMode ?
                            '스터디 정보를 수정할 수 있습니다.' :
                            '스터디 정보를 입력하고 멤버들을 모집해보세요.'
                        }
                    </p>
                </div>

                {/* 폼 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="p-8">
                        {/* 제목 */}
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                스터디 제목 *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                    errors.title ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="예: 토익 900점 달성 스터디"
                                maxLength={100}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                {formData.title.length}/100자
                            </p>
                        </div>

                        {/* 스터디 상태 */}
                        <div className="mb-6">
                            <label htmlFor="studyStatus" className="block text-sm font-medium text-gray-700 mb-2">
                                스터디 상태
                            </label>
                            <select
                                id="studyStatus"
                                name="studyStatus"
                                value={formData.studyStatus}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="RECRUITING">모집중</option>
                                <option value="IN_PROGRESS">진행중</option>
                                <option value="COMPLETED">완료</option>
                            </select>
                        </div>

                        {/* 내용 */}
                        <div className="mb-8">
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                스터디 소개 *
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={8}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                                    errors.content ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="스터디에 대해 자세히 설명해주세요.
• 스터디 목표
• 진행 방식
• 일정 및 장소
• 준비물이나 조건 등"
                                maxLength={1000}
                            />
                            {errors.content && (
                                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                {formData.content.length}/1000자
                            </p>
                        </div>

                        {/* 변경사항 표시 (수정 모드에서만) */}
                        {isEditMode && hasChanges() && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 text-sm">
                                    변경사항이 있습니다. 저장하지 않으면 변경사항이 사라집니다.
                                </p>
                            </div>
                        )}

                        {/* 버튼들 */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || (isEditMode && !hasChanges())}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                        {isEditMode ? '수정 중...' : '생성 중...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEditMode ? '스터디 수정' : '스터디 생성'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 디버그 정보 */}
                <div className="mt-8 bg-gray-50 p-4 rounded text-xs">
                    <p><strong>모드:</strong> {isEditMode ? `수정 (ID: ${editId})` : '생성'}</p>
                    <p><strong>현재 사용자:</strong> {getCurrentUser()?.name || '비로그인'}</p>
                    <p><strong>User Cam Info ID:</strong> {getUserCamInfoId()}</p>
                    <p><strong>API URL:</strong> {serverUrl}/api/studies/{isEditMode ? 'update' : 'create'}</p>
                    {isEditMode && (
                        <p><strong>변경사항 있음:</strong> {hasChanges() ? 'YES' : 'NO'}</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}