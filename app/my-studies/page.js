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
    UserX
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

    // 내 스터디 목록 가져오기 (API가 있다고 가정)
    const fetchMyStudies = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const userCamInfoId = getUserCamInfoId(user);

            // 실제로는 백엔드에서 사용자별 스터디 목록을 가져와야 합니다
            // 여기서는 전체 스터디 목록을 가져와서 필터링하는 방식으로 구현
            const response = await fetch(
                `${serverUrl}/api/studies?userCamInfoId=${userCamInfoId}`,
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

            if (data.code === 'SUCCESS') {
                const allStudies = data.data || data.result || [];

                // 내가 만든 스터디와 참여한 스터디 분류
                const studiesWithMyInfo = await Promise.all(
                    allStudies.map(async (study) => {
                        // 각 스터디의 상세 정보를 가져와서 멤버 정보 확인
                        try {
                            const detailResponse = await fetch(
                                `${serverUrl}/api/studies/detail?studyPostId=${study.id}&userCamInfoId=${userCamInfoId}`,
                                {
                                    method: 'GET',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                }
                            );

                            if (detailResponse.ok) {
                                const detailData = await detailResponse.json();
                                if (detailData.code === 'SUCCESS') {
                                    const studyDetail = detailData.data || detailData.result;

                                    // 내가 작성자인지 확인
                                    const isCreator = String(userCamInfoId) === String(
                                        studyDetail.author?.userCamInfoId ||
                                        studyDetail.author?.id ||
                                        studyDetail.userCamInfoId
                                    );

                                    // 내가 멤버인지 확인
                                    const myMembership = studyDetail.members?.find(member =>
                                        String(member.userCamInfoId) === String(userCamInfoId)
                                    );

                                    return {
                                        ...study,
                                        members: studyDetail.members || [],
                                        isCreator,
                                        myMembership,
                                        isJoined: !!myMembership && myMembership.memberStatus === 'APPROVED',
                                        isPending: !!myMembership && myMembership.memberStatus === 'PENDING'
                                    };
                                }
                            }
                            return { ...study, isCreator: false, myMembership: null, isJoined: false, isPending: false };
                        } catch (error) {
                            console.error(`스터디 ${study.id} 상세 정보 조회 실패:`, error);
                            return { ...study, isCreator: false, myMembership: null, isJoined: false, isPending: false };
                        }
                    })
                );

                setMyStudies(studiesWithMyInfo);
            } else {
                throw new Error(data.message || 'API 응답 오류');
            }
        } catch (error) {
            console.error('스터디 목록 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 스터디 필터링
    const getFilteredStudies = () => {
        switch (activeTab) {
            case 'created':
                return myStudies.filter(study => study.isCreator);
            case 'joined':
                return myStudies.filter(study => study.isJoined && !study.isCreator);
            case 'applied':
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

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR');
        } catch (error) {
            return dateString;
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
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {study.content}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    <span>{formatDate(study.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Users className="w-4 h-4 mr-1" />
                                                    <span>{study.members?.length || 0}명</span>
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
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/study/create?id=${study.id}`)}
                                                        className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </>
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