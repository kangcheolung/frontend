// app/study/[id]/manage/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { getCachedUserData } from '@/app/services/userCache';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';

export default function StudyManagePage() {
    const params = useParams();
    const router = useRouter();
    const [study, setStudy] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'

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
        if (!user) return null;
        return user.userCamInfoId || user.userCamInfo?.id || null;
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (studyId && user) {
            fetchStudyDetail(user);
        }
    }, [studyId]);

    // 스터디 상세 정보 가져오기
    const fetchStudyDetail = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const userCamInfoId = getUserCamInfoId(user);

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

            if (data.code === 'SUCCESS') {
                const studyData = data.data || data.result;
                setStudy(studyData);
                setMembers(studyData.members || []);

                // 권한 체크 - 스터디 리더만 접근 가능
                const currentUserCamInfoId = getUserCamInfoId(user);
                const studyCreatorId = studyData.author?.userCamInfoId ||
                    studyData.author?.id ||
                    studyData.userCamInfoId;

                if (String(currentUserCamInfoId) !== String(studyCreatorId)) {
                    alert('스터디 리더만 접근할 수 있습니다.');
                    router.push(`/study/${studyId}`);
                    return;
                }
            } else {
                throw new Error(data.message || 'API 응답 오류');
            }
        } catch (error) {
            console.error('스터디 정보 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 멤버 승인
    const handleApproveMember = async (studyMemberId) => {
        if (!confirm('이 멤버를 승인하시겠습니까?')) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);

            const response = await fetch(
                `${serverUrl}/api/study-members/approve?studyMemberId=${studyMemberId}&userCamInfoId=${userCamInfoId}`,
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
                alert('멤버가 승인되었습니다.');
                await fetchStudyDetail(currentUser);
            } else {
                throw new Error(data.message || '멤버 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('멤버 승인 실패:', error);
            alert(`멤버 승인에 실패했습니다: ${error.message}`);
        }
    };

    // 멤버 거부
    const handleRejectMember = async (studyMemberId) => {
        if (!confirm('이 멤버를 거부하시겠습니까?')) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);

            const response = await fetch(
                `${serverUrl}/api/study-members/reject?studyMemberId=${studyMemberId}&userCamInfoId=${userCamInfoId}`,
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
                alert('멤버가 거부되었습니다.');
                await fetchStudyDetail(currentUser);
            } else {
                throw new Error(data.message || '멤버 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('멤버 거부 실패:', error);
            alert(`멤버 거부에 실패했습니다: ${error.message}`);
        }
    };

    // 리더 변경
    const handleChangeLeader = async (newLeaderId) => {
        if (!confirm('정말로 리더를 변경하시겠습니까?\n리더 권한이 해당 멤버에게 넘어갑니다.')) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            const requestData = {
                studyPostId: parseInt(studyId),
                newLeaderId: newLeaderId
            };

            const response = await fetch(
                `${serverUrl}/api/study-members/change-leader?userCamInfoId=${userCamInfoId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestData)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.code === 'SUCCESS') {
                alert('리더가 변경되었습니다.');
                router.push(`/study/${studyId}`);
            } else {
                throw new Error(data.message || '리더 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('리더 변경 실패:', error);
            alert(`리더 변경에 실패했습니다: ${error.message}`);
        }
    };

    const handleGoBack = () => {
        router.push(`/study/${studyId}`);
    };

    const pendingMembers = members.filter(member => member.memberStatus === 'PENDING');
    const approvedMembers = members.filter(member => member.memberStatus === 'APPROVED');

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
                            onClick={handleGoBack}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!study) {
        return (
            <Layout requireAuth={true}>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            스터디를 찾을 수 없습니다
                        </h3>
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
        <Layout requireAuth={true}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="mb-6">
                    <button
                        onClick={handleGoBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        스터디로 돌아가기
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">스터디 관리</h1>
                            <p className="text-gray-600 mt-2">{study.title}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => router.push(`/study/create?id=${studyId}`)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                스터디 수정
                            </button>
                        </div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'pending'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    신청 대기 ({pendingMembers.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'approved'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    승인된 멤버 ({approvedMembers.length})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* 컨텐츠 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {activeTab === 'pending' && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">신청 대기 중인 멤버</h2>
                            {pendingMembers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>신청 대기 중인 멤버가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-grow">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="font-medium text-gray-900">{member.userName}</h3>
                                                    {member.userNickname && (
                                                        <span className="ml-2 text-sm text-gray-500">({member.userNickname})</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <p>{member.campusName}</p>
                                                    {member.majorName && <p>{member.majorName}</p>}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        신청일: {new Date(member.createdAt).toLocaleString('ko-KR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleApproveMember(member.id)}
                                                    className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    승인
                                                </button>
                                                <button
                                                    onClick={() => handleRejectMember(member.id)}
                                                    className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    거부
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'approved' && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">승인된 멤버</h2>
                            {approvedMembers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>승인된 멤버가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {approvedMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-grow">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="font-medium text-gray-900">{member.userName}</h3>
                                                    {member.userNickname && (
                                                        <span className="ml-2 text-sm text-gray-500">({member.userNickname})</span>
                                                    )}
                                                    {member.memberRole === 'LEADER' && (
                                                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                            리더
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <p>{member.campusName}</p>
                                                    {member.majorName && <p>{member.majorName}</p>}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        가입일: {new Date(member.createdAt).toLocaleString('ko-KR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                {member.memberRole !== 'LEADER' && (
                                                    <button
                                                        onClick={() => handleChangeLeader(member.userCamInfoId)}
                                                        className="flex items-center px-3 py-2 border border-purple-300 text-purple-700 text-sm rounded hover:bg-purple-50 transition-colors"
                                                    >
                                                        <Crown className="w-4 h-4 mr-1" />
                                                        리더 변경
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 통계 정보 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center">
                            <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">신청 대기</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingMembers.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center">
                            <Users className="w-5 h-5 text-green-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">승인된 멤버</p>
                                <p className="text-2xl font-bold text-gray-900">{approvedMembers.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center">
                            <Users className="w-5 h-5 text-blue-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">전체 멤버</p>
                                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}