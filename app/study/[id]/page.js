// app/study/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { getCachedUserData } from '@/app/services/userCache';

export default function StudyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [study, setStudy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const studyId = params.id;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    // 현재 사용자 정보 가져오기
    const getCurrentUser = () => {
        const cachedUser = getCachedUserData();
        setCurrentUser(cachedUser);
        return cachedUser;
    };

    // userCamInfoId 가져오기
    const getUserCamInfoId = (user) => {
        if (user?.userCamInfo?.id) {
            return user.userCamInfo.id;
        }
        return 9; // 기본값
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (studyId) {
            fetchStudyDetail(user);
        }
    }, [studyId]);

    const fetchStudyDetail = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const userCamInfoId = getUserCamInfoId(user);
            console.log(`스터디 상세 조회: studyId=${studyId}, userCamInfoId=${userCamInfoId}`);

            const response = await fetch(
                `${serverUrl}/api/studies/detail?studyPostId=${studyId}&userCamInfoId=${userCamInfoId}`,
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
            console.log('API 응답:', data);

            if (data.code === 'SUCCESS') {
                const studyData = data.data || data.result;
                setStudy(studyData);
            } else {
                throw new Error(data.message || 'API 응답 오류');
            }
        } catch (error) {
            console.error('스터디 상세 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 권한 체크 함수들
    const isStudyCreator = () => {
        if (!currentUser || !study) return false;

        // 스터디 작성자의 userCamInfoId와 현재 사용자의 userCamInfoId 비교
        const currentUserCamInfoId = getUserCamInfoId(currentUser);
        const studyCreatorId = study.author?.id || study.userCamInfoId;

        console.log('권한 체크:', {
            currentUserCamInfoId,
            studyCreatorId,
            isCreator: currentUserCamInfoId === studyCreatorId
        });

        return currentUserCamInfoId === studyCreatorId;
    };

    const isAlreadyMember = () => {
        if (!currentUser || !study || !study.members) return false;

        const currentUserCamInfoId = getUserCamInfoId(currentUser);

        // 스터디 멤버 목록에서 현재 사용자 확인
        const isMember = study.members.some(member =>
            member.userCamInfoId === currentUserCamInfoId
        );

        console.log('멤버 체크:', {
            currentUserCamInfoId,
            members: study.members,
            isMember
        });

        return isMember;
    };

    const canApplyToStudy = () => {
        return study &&
            study.studyStatus === 'RECRUITING' &&
            !isAlreadyMember() &&
            currentUser; // 로그인한 사용자만
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleApplyStudy = () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }
        // TODO: 스터디 신청 API 구현
        alert('스터디 신청 기능은 준비중입니다.');
    };

    const handleEditStudy = () => {
        router.push(`/study/create?id=${studyId}`);
    };

    const handleDeleteStudy = async () => {
        if (!confirm('정말로 이 스터디를 삭제하시겠습니까?\n삭제된 스터디는 복구할 수 없습니다.')) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            console.log('스터디 삭제 요청:', { studyId, userCamInfoId });

            const response = await fetch(
                `${serverUrl}/api/studies/delete?studyPostId=${studyId}&userCamInfoId=${userCamInfoId}`,
                {
                    method: 'POST',
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
            console.log('스터디 삭제 응답:', data);

            if (data.code === 'SUCCESS') {
                alert('스터디가 성공적으로 삭제되었습니다.');
                router.push('/study'); // 스터디 목록으로 이동
            } else {
                throw new Error(data.message || '스터디 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 삭제 실패:', error);
            alert(`스터디 삭제에 실패했습니다: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <Layout requireAuth={false}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p>로딩 중...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout requireAuth={false}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-red-800 font-medium mb-2">오류 발생</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={fetchStudyDetail}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                다시 시도
                            </button>
                            <button
                                onClick={handleGoBack}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!study) {
        return (
            <Layout requireAuth={false}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            스터디를 찾을 수 없습니다
                        </h3>
                        <p className="text-gray-600 mb-4">
                            존재하지 않거나 삭제된 스터디입니다.
                        </p>
                        <button
                            onClick={handleGoBack}
                            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout requireAuth={false}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 뒤로가기 버튼 */}
                <div className="mb-6">
                    <button
                        onClick={handleGoBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        ← 돌아가기
                    </button>
                </div>

                {/* 스터디 정보 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    {/* 상태 배지 */}
                    <div className="mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            study.studyStatus === 'RECRUITING'
                                ? 'bg-green-100 text-green-800'
                                : study.studyStatus === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                        }`}>
                            {study.studyStatus === 'RECRUITING' ? '모집중' :
                                study.studyStatus === 'IN_PROGRESS' ? '진행중' : '완료'}
                        </span>
                    </div>

                    {/* 제목 */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {study.title}
                    </h1>

                    {/* 작성자 정보 */}
                    {study.author && (
                        <div className="mb-6 text-gray-600">
                            <p>작성자: {study.author.userName}</p>
                            {study.author.campusName && (
                                <p className="text-sm">소속: {study.author.campusName}</p>
                            )}
                        </div>
                    )}

                    {/* 내용 */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">스터디 소개</h2>
                        <div className="prose max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {study.content}
                            </p>
                        </div>
                    </div>

                    {/* 날짜 정보 */}
                    <div className="border-t pt-4 text-sm text-gray-500">
                        <p>생성일: {new Date(study.createdAt).toLocaleString('ko-KR')}</p>
                        {study.updatedAt !== study.createdAt && (
                            <p>수정일: {new Date(study.updatedAt).toLocaleString('ko-KR')}</p>
                        )}
                    </div>

                    {/* 액션 버튼들 - 권한에 따라 조건부 표시 */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        {/* 신청하기 버튼 - 모집중이고, 멤버가 아니고, 로그인한 경우 */}
                        {canApplyToStudy() && (
                            <button
                                onClick={handleApplyStudy}
                                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                                신청하기
                            </button>
                        )}

                        {/* 이미 멤버인 경우 */}
                        {isAlreadyMember() && (
                            <div className="px-6 py-2 bg-green-100 text-green-800 rounded border border-green-200">
                                참여중인 스터디
                            </div>
                        )}

                        {/* 수정/삭제 버튼 - 스터디 생성자만 */}
                        {isStudyCreator() && (
                            <>
                                <button
                                    onClick={handleEditStudy}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                >
                                    수정
                                </button>
                                <button
                                    onClick={handleDeleteStudy}
                                    className="px-6 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                                >
                                    삭제
                                </button>
                            </>
                        )}

                        {/* 로그인하지 않은 경우 */}
                        {!currentUser && study?.studyStatus === 'RECRUITING' && (
                            <div className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
                                로그인 후 신청 가능
                            </div>
                        )}

                        {/* 모집 완료된 경우 */}
                        {study?.studyStatus !== 'RECRUITING' && !isAlreadyMember() && (
                            <div className="px-6 py-2 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                모집이 마감되었습니다
                            </div>
                        )}
                    </div>

                    {/* 멤버 정보 (있는 경우) */}
                    {study.members && study.members.length > 0 && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">참여 멤버 ({study.members.length}명)</h3>
                            <div className="space-y-2">
                                {study.members.map((member, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                            <span className="font-medium">{member.userName || '사용자'}</span>
                                            {member.campusName && (
                                                <span className="ml-2 text-sm text-gray-500">({member.campusName})</span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                member.memberRole === 'LEADER'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {member.memberRole === 'LEADER' ? '리더' : '멤버'}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                member.memberStatus === 'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {member.memberStatus === 'PENDING' ? '대기중' : '승인됨'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 디버그 정보 */}
                <div className="mt-8 bg-gray-50 p-4 rounded text-xs">
                    <p><strong>스터디 ID:</strong> {studyId}</p>
                    <p><strong>User Cam Info ID:</strong> {getUserCamInfoId(currentUser)}</p>
                    <p><strong>현재 사용자:</strong> {currentUser ? currentUser.name || '로그인됨' : '비로그인'}</p>
                    <p><strong>스터디 생성자:</strong> {isStudyCreator() ? 'YES' : 'NO'}</p>
                    <p><strong>이미 멤버:</strong> {isAlreadyMember() ? 'YES' : 'NO'}</p>
                    <p><strong>신청 가능:</strong> {canApplyToStudy() ? 'YES' : 'NO'}</p>
                    <p><strong>API URL:</strong> {serverUrl}/api/studies/detail</p>
                </div>
            </div>
        </Layout>
    );
}