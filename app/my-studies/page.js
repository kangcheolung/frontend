// app/my-studies/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { getCachedUserData } from '@/app/services/userCache';
import {
    Crown,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Edit,
    Settings,
    Plus,
    UserCheck,
    UserX,
    Trash2
} from 'lucide-react';

export default function MyStudiesPage() {
    const router = useRouter();
    const [myStudies, setMyStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('created'); // 'created' | 'joined' | 'applied'

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    // 현재 사용자 정보 가져오기
    const getCurrentUser = () => {
        const cachedUser = getCachedUserData();
        setCurrentUser(cachedUser);
        return cachedUser;
    };

    // userCamInfoId 가져오기
    const getUserCamInfoId = (user) => {
        if (!user) return null;
        return user.userCamInfoId || user.userCamInfo?.id || null;
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            fetchMyStudies(user);
        }
    }, []);

    // 내 스터디 목록 가져오기
    const fetchMyStudies = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const userCamInfoId = getUserCamInfoId(user);
            console.log('🔍 현재 사용자 정보:', { user, userCamInfoId });

            // 백엔드의 my-studies API 호출
            const response = await fetch(
                `${serverUrl}/api/study-members/my-studies?userCamInfoId=${userCamInfoId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            console.log('📡 API 응답 상태:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 전체 응답 데이터:', data);

            if (data.code === 'SUCCESS') {
                const studies = data.data || data.result || [];
                console.log('📚 받아온 스터디 목록:', studies);
                console.log('📊 스터디 개수:', studies.length);

                // MyStudyResponse 형식에 맞게 데이터 변환
                const formattedStudies = studies.map((study, index) => {
                    console.log(`🔹 스터디 ${index + 1} 원본 데이터:`, study);

                    const formatted = {
                        id: study.studyPostId,
                        title: study.studyTitle,
                        content: study.studyContent,
                        studyStatus: study.studyStatus,
                        createdAt: study.studyCreatedAt,
                        membershipId: study.membershipId,
                        myRole: study.myRole,
                        myStatus: study.myStatus,
                        joinedAt: study.joinedAt,
                        authorName: study.authorName,
                        authorNickname: study.authorNickname,
                        // 내가 작성자인지 확인 (LEADER 역할이면 작성자)
                        isCreator: study.myRole === 'LEADER',
                        // 승인된 멤버인지 확인
                        isJoined: study.myStatus === 'APPROVED',
                        // 대기 중인지 확인
                        isPending: study.myStatus === 'PENDING',
                        // 거절되었는지 확인
                        isRejected: study.myStatus === 'REJECTED'
                    };

                    console.log(`🔸 스터디 ${index + 1} 변환된 데이터:`, formatted);
                    return formatted;
                });

                console.log('✅ 최종 변환된 스터디 목록:', formattedStudies);

                // 분류별 확인
                const created = formattedStudies.filter(s => s.isCreator);
                const joined = formattedStudies.filter(s => s.isJoined && !s.isCreator);
                const pending = formattedStudies.filter(s => s.isPending);

                console.log('📌 분류 결과:', {
                    '내가 만든 스터디': created,
                    '참여 중인 스터디': joined,
                    '신청 대기 중': pending
                });

                setMyStudies(formattedStudies);
            } else {
                throw new Error(data.message || 'API 응답 오류');
            }
        } catch (error) {
            console.error('❌ 스터디 목록 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR');
        } catch (error) {
            return dateString;
        }
    };

    // 스터디 탈퇴
    const handleLeaveStudy = async (membershipId, studyTitle) => {
        if (!confirm(`정말로 "${studyTitle}" 스터디에서 탈퇴하시겠습니까?`)) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            const response = await fetch(
                `${serverUrl}/api/study-members/leave?studyMemberId=${membershipId}&userCamInfoId=${userCamInfoId}`,
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

            if (data.code === 'SUCCESS') {
                alert('스터디에서 탈퇴했습니다.');
                fetchMyStudies(currentUser); // 목록 새로고침
            } else {
                throw new Error(data.message || '탈퇴 실패');
            }
        } catch (error) {
            console.error('스터디 탈퇴 실패:', error);
            alert('스터디 탈퇴에 실패했습니다: ' + error.message);
        }
    };

    // 스터디 신청 취소 (대기 중인 신청 취소)
    const handleCancelApplication = async (membershipId, studyTitle) => {
        if (!confirm(`"${studyTitle}" 스터디 신청을 취소하시겠습니까?`)) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            // 신청 취소도 leave API를 사용
            const response = await fetch(
                `${serverUrl}/api/study-members/leave?studyMemberId=${membershipId}&userCamInfoId=${userCamInfoId}`,
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

            if (data.code === 'SUCCESS') {
                alert('스터디 신청을 취소했습니다.');
                fetchMyStudies(currentUser); // 목록 새로고침
            } else {
                throw new Error(data.message || '신청 취소 실패');
            }
        } catch (error) {
            console.error('스터디 신청 취소 실패:', error);
            alert('스터디 신청 취소에 실패했습니다: ' + error.message);
        }
    };

    // 스터디 삭제 (내가 만든 스터디)
    const handleDeleteStudy = async (studyId, studyTitle) => {
        if (!confirm(`정말로 "${studyTitle}" 스터디를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            const response = await fetch(
                `${serverUrl}/api/studies/delete?studyPostId=${studyId}&userCamInfoId=${userCamInfoId}`,
                {
                    method: 'DELETE',
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

            if (data.code === 'SUCCESS') {
                alert('스터디가 삭제되었습니다.');
                fetchMyStudies(currentUser); // 목록 새로고침
            } else {
                throw new Error(data.message || '삭제 실패');
            }
        } catch (error) {
            console.error('스터디 삭제 실패:', error);
            alert('스터디 삭제에 실패했습니다: ' + error.message);
        }
    };

    // 스터디 필터링
    const getFilteredStudies = () => {
        switch (activeTab) {
            case 'created':
                // LEADER 역할인 스터디들
                return myStudies.filter(study => study.isCreator);
            case 'joined':
                // APPROVED 상태이면서 LEADER가 아닌 스터디들
                return myStudies.filter(study => study.isJoined && !study.isCreator);
            case 'applied':
                // PENDING 상태인 스터디들
                return myStudies.filter(study => study.isPending);
            default:
                return [];
        }
    };

    const filteredStudies = getFilteredStudies();

    // 상태별 스타일
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

    if (loading) {
        return (
            <Layout requireAuth={true}>
                <div className="max-w-6xl mx-auto px-4 py-8">
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
            <Layout requireAuth={true}>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-red-800 font-medium mb-2">오류 발생</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => fetchMyStudies(currentUser)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            다시 시도
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const createdStudies = myStudies.filter(study => study.isCreator);
    const joinedStudies = myStudies.filter(study => study.isJoined && !study.isCreator);
    const appliedStudies = myStudies.filter(study => study.isPending);

    return (
        <Layout requireAuth={true}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">내 스터디</h1>
                            <p className="text-gray-600 mt-2">참여하고 있는 스터디들을 관리해보세요.</p>
                        </div>
                        <button
                            onClick={() => router.push('/study/create')}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            새 스터디 만들기
                        </button>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <Crown className="w-8 h-8 text-purple-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">내가 만든 스터디</p>
                                <p className="text-2xl font-bold text-gray-900">{createdStudies.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <UserCheck className="w-8 h-8 text-green-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">참여 중인 스터디</p>
                                <p className="text-2xl font-bold text-gray-900">{joinedStudies.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">신청 대기 중</p>
                                <p className="text-2xl font-bold text-gray-900">{appliedStudies.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('created')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'created'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Crown className="w-4 h-4 mr-2" />
                                    내가 만든 스터디 ({createdStudies.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('joined')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'joined'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    참여 중인 스터디 ({joinedStudies.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('applied')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'applied'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    신청 대기 중 ({appliedStudies.length})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* 스터디 목록 */}
                <div className="space-y-4">
                    {filteredStudies.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                            <div className="text-gray-400 mb-4">
                                {activeTab === 'created' && <Crown className="w-16 h-16 mx-auto mb-4" />}
                                {activeTab === 'joined' && <UserCheck className="w-16 h-16 mx-auto mb-4" />}
                                {activeTab === 'applied' && <Clock className="w-16 h-16 mx-auto mb-4" />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {activeTab === 'created' && '만든 스터디가 없습니다'}
                                {activeTab === 'joined' && '참여 중인 스터디가 없습니다'}
                                {activeTab === 'applied' && '신청 대기 중인 스터디가 없습니다'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {activeTab === 'created' && '새로운 스터디를 만들어보세요!'}
                                {activeTab === 'joined' && '관심있는 스터디에 참여해보세요!'}
                                {activeTab === 'applied' && '스터디에 신청해보세요!'}
                            </p>
                            {activeTab === 'created' && (
                                <button
                                    onClick={() => router.push('/study/create')}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    스터디 만들기
                                </button>
                            )}
                            {(activeTab === 'joined' || activeTab === 'applied') && (
                                <button
                                    onClick={() => router.push('/study')}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    스터디 둘러보기
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredStudies.map((study) => (
                            <div key={study.id} className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 mr-3">
                                                    {study.title}
                                                </h3>
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusStyle(study.studyStatus)}`}>
                                                    {getStatusText(study.studyStatus)}
                                                </span>
                                                {study.isCreator && (
                                                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                        내가 만든 스터디
                                                    </span>
                                                )}
                                                {study.isPending && (
                                                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                                        승인 대기
                                                    </span>
                                                )}
                                                {study.isRejected && (
                                                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                        거절됨
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {study.content}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    <span>생성일: {formatDate(study.createdAt)}</span>
                                                </div>
                                                {study.joinedAt && !study.isCreator && (
                                                    <div className="flex items-center">
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        <span>가입일: {formatDate(study.joinedAt)}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center">
                                                    <Users className="w-4 h-4 mr-1" />
                                                    <span>작성자: {study.authorNickname || study.authorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => router.push(`/study/${study.id}`)}
                                                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                            >
                                                상세보기
                                            </button>
                                            {study.isCreator && (
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/study/${study.id}/manage`)}
                                                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                        title="스터디 관리"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/study/create?id=${study.id}`)}
                                                        className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                                        title="스터디 수정"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudy(study.id, study.title)}
                                                        className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                        title="스터디 삭제"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {study.isJoined && !study.isCreator && (
                                                <button
                                                    onClick={() => handleLeaveStudy(study.membershipId, study.title)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                    title="스터디 탈퇴"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            )}
                                            {study.isPending && (
                                                <button
                                                    onClick={() => handleCancelApplication(study.membershipId, study.title)}
                                                    className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                                    title="신청 취소"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}