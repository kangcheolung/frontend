// app/study/[id]/manage/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { getCachedUserData } from '@/app/services/userCache';
import { notificationService } from '@/app/services/notificationService';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';

export default function StudyManagePage() {
    const params = useParams();
    const router = useRouter();
    const [study, setStudy] = useState(null);
    const [applicants, setApplicants] = useState([]); // 신청자 목록
    const [members, setMembers] = useState([]); // 승인된 멤버 목록
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
            fetchStudyData(user);
        }
    }, [studyId]);

    // 스터디 데이터 가져오기
    const fetchStudyData = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const userCamInfoId = getUserCamInfoId(user);

            // 병렬로 데이터 가져오기
            const [studyResponse, applicantsResponse, membersResponse] = await Promise.all([
                // 스터디 상세 정보
                fetch(`${serverUrl}/api/studies/detail?studyPostId=${studyId}&userCamInfoId=${userCamInfoId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }),
                // 신청자 목록
                fetch(`${serverUrl}/api/study-members/applicants?studyPostId=${studyId}&userCamInfoId=${userCamInfoId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }),
                // 전체 멤버 목록
                fetch(`${serverUrl}/api/study-members/list?studyPostId=${studyId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })
            ]);

            // 응답 확인
            if (!studyResponse.ok) throw new Error(`스터디 정보 조회 실패: ${studyResponse.status}`);
            if (!applicantsResponse.ok) throw new Error(`신청자 조회 실패: ${applicantsResponse.status}`);
            if (!membersResponse.ok) throw new Error(`멤버 조회 실패: ${membersResponse.status}`);

            const studyData = await studyResponse.json();
            const applicantsData = await applicantsResponse.json();
            const membersData = await membersResponse.json();

            console.log('📚 스터디 상세 정보:', studyData);
            console.log('📋 신청자 목록:', applicantsData);
            console.log('👥 전체 멤버 목록:', membersData);

            if (studyData.code === 'SUCCESS') {
                const studyInfo = studyData.data || studyData.result;
                setStudy(studyInfo);

                // 권한 체크 - 스터디 리더만 접근 가능
                const currentUserCamInfoId = getUserCamInfoId(user);
                const studyCreatorId = studyInfo.author?.userCamInfoId ||
                    studyInfo.author?.id ||
                    studyInfo.userCamInfoId;

                console.log('🔐 권한 체크:', { currentUserCamInfoId, studyCreatorId });

                if (String(currentUserCamInfoId) !== String(studyCreatorId)) {
                    // 리더가 아닌 경우 리더 권한 체크
                    const allMembers = membersData.data || membersData.result || [];
                    const currentUserMember = allMembers.find(m =>
                        String(m.userCamInfoId) === String(currentUserCamInfoId) &&
                        m.memberRole === 'LEADER'
                    );

                    if (!currentUserMember) {
                        alert('스터디 리더만 접근할 수 있습니다.');
                        router.push(`/study/${studyId}`);
                        return;
                    }
                }
            }

            // 신청자 목록 설정
            if (applicantsData.code === 'SUCCESS') {
                const applicantsList = applicantsData.data || applicantsData.result || [];
                setApplicants(applicantsList);
                console.log('✅ 신청자 수:', applicantsList.length);
            }

            // 멤버 목록 설정 (승인된 멤버만 필터링)
            if (membersData.code === 'SUCCESS') {
                const allMembers = membersData.data || membersData.result || [];
                const approvedMembers = allMembers.filter(member => member.memberStatus === 'APPROVED');
                setMembers(approvedMembers);
                console.log('✅ 전체 멤버 수:', approvedMembers.length);
            }

        } catch (error) {
            console.error('❌ 데이터 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 멤버 승인
    const handleApproveMember = async (studyMemberId, memberName) => {
        if (!confirm(`${memberName}님을 승인하시겠습니까?`)) {
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
                // 🔔 승인 알림 생성 추가
                try {
                    await notificationService.createStudyApproveNotification(studyMemberId);
                    console.log('✅ 승인 알림 생성 완료');
                } catch (notificationError) {
                    console.error('⚠️ 승인 알림 생성 실패:', notificationError);
                    // 알림 생성 실패해도 메인 기능은 계속 진행
                }

                alert(`${memberName}님이 승인되었습니다.`);
                await fetchStudyData(currentUser);
            } else {
                throw new Error(data.message || '멤버 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('멤버 승인 실패:', error);
            alert(`멤버 승인에 실패했습니다: ${error.message}`);
        }
    };

    // 멤버 거부
    const handleRejectMember = async (studyMemberId, memberName) => {
        if (!confirm(`${memberName}님의 신청을 거부하시겠습니까?`)) {
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
                // 🔔 거부 알림 생성 추가
                try {
                    await notificationService.createStudyRejectNotification(studyMemberId);
                    console.log('✅ 거부 알림 생성 완료');
                } catch (notificationError) {
                    console.error('⚠️ 거부 알림 생성 실패:', notificationError);
                    // 알림 생성 실패해도 메인 기능은 계속 진행
                }

                alert(`${memberName}님의 신청이 거부되었습니다.`);
                await fetchStudyData(currentUser);
            } else {
                throw new Error(data.message || '멤버 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('멤버 거부 실패:', error);
            alert(`멤버 거부에 실패했습니다: ${error.message}`);
        }
    };

    // 리더 변경
    const handleChangeLeader = async (targetMemberId, memberName) => {
        if (!confirm(`정말로 ${memberName}님에게 리더 권한을 넘기시겠습니까?\n이 작업을 수행하면 더 이상 스터디를 관리할 수 없습니다.`)) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            const requestData = {
                studyPostId: parseInt(studyId),
                newLeaderId: targetMemberId  // StudyMember의 ID를 전달
            };

            console.log('🔄 리더 변경 요청:', {
                currentLeaderUserCamInfoId: userCamInfoId,
                newLeaderMemberId: targetMemberId,
                studyPostId: studyId
            });

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
                alert(`${memberName}님이 새로운 리더가 되었습니다.`);
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

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
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
                                    신청 대기 ({applicants.length})
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
                                    전체 멤버 ({members.length})
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
                            {applicants.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>신청 대기 중인 멤버가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applicants.map((member) => (
                                        <div key={member.id}
                                             className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-grow">
                                                        {/* 기본 정보 */}
                                                        <div className="flex items-center mb-3">
                                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                                <span className="text-indigo-600 font-medium text-sm">
                                                                    {member.userName?.charAt(0) || '?'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">{member.userName}</h3>
                                                                {member.userNickname && (
                                                                    <span
                                                                        className="text-sm text-gray-500">({member.userNickname})</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* 상세 정보와 신청 메시지 */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div className="text-sm text-gray-600">
                                                                <p className="flex items-center mb-1">
                                                                    <span className="font-medium mr-2">캠퍼스:</span>
                                                                    {member.campusName}
                                                                </p>
                                                                {member.majorName && (
                                                                    <p className="flex items-center mb-1">
                                                                        <span className="font-medium mr-2">전공:</span>
                                                                        {member.majorName}
                                                                    </p>
                                                                )}
                                                                <p className="flex items-center text-xs text-gray-500">
                                                                    <span className="font-medium mr-2">신청일:</span>
                                                                    {formatDate(member.createdAt)}
                                                                </p>
                                                            </div>

                                                            {/* 신청 메시지 */}
                                                            {member.applyMessage && (
                                                                <div
                                                                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                                        💬 신청 메시지
                                                                    </h4>
                                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                        {member.applyMessage}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 액션 버튼 */}
                                                    <div className="flex flex-col space-y-2 ml-4">
                                                        <button
                                                            onClick={() => handleApproveMember(member.id, member.userName)}
                                                            className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1"/>
                                                            승인
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectMember(member.id, member.userName)}
                                                            className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1"/>
                                                            거부
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'approved' && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">전체 멤버</h2>
                            {members.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                                    <p>승인된 멤버가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {members.map((member) => {
                                        const isCurrentUser = String(member.userCamInfoId) === String(getUserCamInfoId(currentUser));
                                        return (
                                            <div key={member.id}
                                                 className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-grow">
                                                    <div className="flex items-center mb-2">
                                                        <h3 className="font-medium text-gray-900">{member.userName}</h3>
                                                        {member.userNickname && (
                                                            <span
                                                                className="ml-2 text-sm text-gray-500">({member.userNickname})</span>
                                                        )}
                                                        {member.memberRole === 'LEADER' && (
                                                            <span
                                                                className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                                리더
                                                            </span>
                                                        )}
                                                        {isCurrentUser && (
                                                            <span
                                                                className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                나
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <p>{member.campusName}</p>
                                                        {member.majorName && <p>{member.majorName}</p>}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            가입일: {formatDate(member.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 ml-4">
                                                    {/* 리더가 아니고, 본인이 아닌 경우에만 리더 변경 버튼 표시 */}
                                                    {member.memberRole !== 'LEADER' && !isCurrentUser && (
                                                        <button
                                                            onClick={() => handleChangeLeader(member.id, member.userName)}
                                                            className="flex items-center px-3 py-2 border border-purple-300 text-purple-700 text-sm rounded hover:bg-purple-50 transition-colors"
                                                        >
                                                            <Crown className="w-4 h-4 mr-1"/>
                                                            리더 변경
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}