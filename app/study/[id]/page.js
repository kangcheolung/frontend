// app/study/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/app/components/layout';
import { getCachedUserData } from '@/app/services/userCache';
import { MessageCircle, Edit2, Trash2, Send, X, Check } from 'lucide-react';

export default function StudyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [study, setStudy] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [commentContent, setCommentContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const studyId = params.id;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

    // 현재 사용자 정보 가져오기
    const getCurrentUser = () => {
        const cachedUser = getCachedUserData();
        setCurrentUser(cachedUser);
        return cachedUser;
    };

    // userCamInfoId 가져오기 - 통일된 방식
    const getUserCamInfoId = (user) => {
        if (!user) {
            console.log('사용자 정보가 없습니다.');
            return 9; // 기본값
        }

        // 여러 가능한 경로를 시도
        let userCamInfoId = null;

        // 첫 번째 시도: 직접 userCamInfoId 필드
        if (user.userCamInfoId) {
            userCamInfoId = user.userCamInfoId;
        }
        // 두 번째 시도: userCamInfo.id 경로
        else if (user.userCamInfo?.id) {
            userCamInfoId = user.userCamInfo.id;
        }

        console.log('getUserCamInfoId 결과:', {
            user: user,
            userCamInfoId: userCamInfoId,
            directPath: user.userCamInfoId,
            nestedPath: user.userCamInfo?.id
        });

        return userCamInfoId || 9; // 기본값
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (studyId) {
            fetchStudyDetail(user);
            fetchComments();
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
                console.log('스터디 데이터:', studyData);
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

    // 댓글 목록 가져오기
    const fetchComments = async () => {
        try {
            const response = await fetch(
                `${serverUrl}/api/studyComments/list?studyPostId=${studyId}`,
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
            console.log('댓글 목록:', data);

            if (data.code === 'SUCCESS') {
                setComments(data.data || data.result || []);
            }
        } catch (error) {
            console.error('댓글 목록 조회 실패:', error);
            // 댓글 로드 실패는 전체 페이지 에러로 처리하지 않음
        }
    };

    // 댓글 작성
    const handleSubmitComment = async () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!commentContent.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            setSubmittingComment(true);
            const userCamInfoId = getUserCamInfoId(currentUser);
            const requestData = {
                content: commentContent.trim(),
                studyPostId: parseInt(studyId)
            };

            console.log('댓글 작성 요청:', requestData);

            const response = await fetch(
                `${serverUrl}/api/studyComments/create?userCamInfoId=${userCamInfoId}`,
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
                setCommentContent('');
                fetchComments(); // 댓글 목록 새로고침
            } else {
                throw new Error(data.message || '댓글 작성 실패');
            }
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다: ' + error.message);
        } finally {
            setSubmittingComment(false);
        }
    };

    // 댓글 수정
    const handleUpdateComment = async (commentId) => {
        if (!editingContent.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            const requestData = {
                content: editingContent.trim(),
                studyPostId: parseInt(studyId)
            };

            const response = await fetch(
                `${serverUrl}/api/studyComments/update?commentId=${commentId}&userCamInfoId=${userCamInfoId}`,
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
                setEditingCommentId(null);
                setEditingContent('');
                fetchComments(); // 댓글 목록 새로고침
            } else {
                throw new Error(data.message || '댓글 수정 실패');
            }
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            alert('댓글 수정에 실패했습니다: ' + error.message);
        }
    };

    // 댓글 삭제
    const handleDeleteComment = async (commentId) => {
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);

            const response = await fetch(
                `${serverUrl}/api/studyComments/delete?commentId=${commentId}&userCamInfoId=${userCamInfoId}`,
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
                fetchComments(); // 댓글 목록 새로고침
            } else {
                throw new Error(data.message || '댓글 삭제 실패');
            }
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert('댓글 삭제에 실패했습니다: ' + error.message);
        }
    };

    // 권한 체크 함수들
    const isStudyCreator = () => {
        if (!currentUser || !study) return false;

        const currentUserCamInfoId = getUserCamInfoId(currentUser);

        // 스터디 작성자 ID를 여러 경로에서 확인
        const studyCreatorId = study.author?.userCamInfoId ||
            study.author?.id ||
            study.userCamInfoId;

        console.log('권한 체크 상세:', {
            currentUser: currentUser,
            currentUserCamInfoId: currentUserCamInfoId,
            study: study,
            studyAuthor: study.author,
            studyCreatorId: studyCreatorId,
            'study.author?.userCamInfoId': study.author?.userCamInfoId,
            'study.author?.id': study.author?.id,
            'study.userCamInfoId': study.userCamInfoId,
            isCreator: String(currentUserCamInfoId) === String(studyCreatorId),
            typeCheck: {
                currentType: typeof currentUserCamInfoId,
                studyType: typeof studyCreatorId,
                currentValue: currentUserCamInfoId,
                studyValue: studyCreatorId
            }
        });

        // 문자열로 변환해서 비교 (타입 불일치 방지)
        return String(currentUserCamInfoId) === String(studyCreatorId);
    };

    const isAlreadyMember = () => {
        if (!currentUser || !study || !study.members) return false;

        const currentUserCamInfoId = getUserCamInfoId(currentUser);

        // 스터디 멤버 목록에서 현재 사용자 확인
        const isMember = study.members.some(member =>
            String(member.userCamInfoId) === String(currentUserCamInfoId)
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
            !isStudyCreator() && // 스터디 생성자는 신청할 수 없음
            currentUser; // 로그인한 사용자만
    };

    const isCommentAuthor = (comment) => {
        if (!currentUser) return false;
        const currentUserCamInfoId = getUserCamInfoId(currentUser);
        return String(comment.userCamInfoId) === String(currentUserCamInfoId);
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleApplyStudy = async () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!canApplyToStudy()) {
            alert('신청할 수 없는 스터디입니다.');
            return;
        }

        // 신청 메시지 입력받기
        const applyMessage = prompt('신청 메시지를 입력해주세요 (선택사항):', '안녕하세요! 스터디에 참여하고 싶습니다.');

        // 취소한 경우
        if (applyMessage === null) {
            return;
        }

        try {
            const userCamInfoId = getUserCamInfoId(currentUser);
            console.log('스터디 신청 요청:', { studyId, userCamInfoId, applyMessage });

            const requestData = {
                studyPostId: parseInt(studyId),
                applyMessage: applyMessage || '' // 빈 문자열로 기본값 설정
            };

            const response = await fetch(
                `${serverUrl}/api/study-members/apply?userCamInfoId=${userCamInfoId}`,
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
            console.log('스터디 신청 응답:', data);

            if (data.code === 'SUCCESS') {
                alert('스터디 신청이 완료되었습니다!\n스터디 리더의 승인을 기다려주세요.');
                // 페이지 새로고침으로 상태 업데이트
                await fetchStudyDetail(currentUser);
            } else {
                throw new Error(data.message || '스터디 신청에 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 신청 실패:', error);
            alert(`스터디 신청에 실패했습니다: ${error.message}`);
        }
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

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;

            // 1분 미만
            if (diff < 60 * 1000) {
                return '방금 전';
            }
            // 1시간 미만
            if (diff < 60 * 60 * 1000) {
                const minutes = Math.floor(diff / (60 * 1000));
                return `${minutes}분 전`;
            }
            // 24시간 미만
            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor(diff / (60 * 60 * 1000));
                return `${hours}시간 전`;
            }
            // 7일 미만
            if (diff < 7 * 24 * 60 * 60 * 1000) {
                const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                return `${days}일 전`;
            }

            // 그 외
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
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
                                onClick={() => fetchStudyDetail(currentUser)}
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
                        {/* 수정/삭제/관리 버튼 - 스터디 생성자만 (최우선) */}
                        {isStudyCreator() && (
                            <>
                                <button
                                    onClick={() => router.push(`/study/${studyId}/manage`)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                    스터디 관리
                                </button>
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

                        {/* 이미 멤버인 경우 */}
                        {!isStudyCreator() && isAlreadyMember() && (
                            <div className="px-6 py-2 bg-green-100 text-green-800 rounded border border-green-200">
                                참여중인 스터디
                            </div>
                        )}

                        {/* 신청하기 버튼 - 모집중이고, 멤버가 아니고, 생성자가 아니고, 로그인한 경우 */}
                        {canApplyToStudy() && (
                            <button
                                onClick={handleApplyStudy}
                                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                                신청하기
                            </button>
                        )}

                        {/* 로그인하지 않은 경우 */}
                        {!currentUser && study?.studyStatus === 'RECRUITING' && (
                            <div className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
                                로그인 후 신청 가능
                            </div>
                        )}

                        {/* 모집 완료된 경우 */}
                        {study?.studyStatus !== 'RECRUITING' && !isAlreadyMember() && !isStudyCreator() && (
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

                {/* 댓글 섹션 */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center mb-6">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        <h3 className="text-lg font-semibold">댓글 ({comments.length})</h3>
                    </div>

                    {/* 댓글 작성 폼 */}
                    {currentUser ? (
                        <div className="mb-6">
                            <div className="flex items-start space-x-3">
                                <div className="flex-grow">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="댓글을 입력해주세요..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        rows={3}
                                    />
                                </div>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={submittingComment || !commentContent.trim()}
                                    className={`px-4 py-3 rounded-lg flex items-center transition-colors ${
                                        submittingComment || !commentContent.trim()
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                            댓글을 작성하려면 로그인이 필요합니다.
                        </div>
                    )}

                    {/* 댓글 목록 */}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow">
                                            <div className="flex items-center mb-2">
                                                <span className="font-medium text-gray-900">
                                                    {comment.author?.name || comment.author?.userName || '사용자'}
                                                </span>
                                                {comment.author?.campusName && (
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        ({comment.author.campusName})
                                                    </span>
                                                )}
                                                <span className="ml-2 text-xs text-gray-400">
                                                    {formatDate(comment.createdAt)}
                                                </span>
                                                {comment.updatedAt !== comment.createdAt && (
                                                    <span className="ml-1 text-xs text-gray-400">(수정됨)</span>
                                                )}
                                            </div>
                                            {editingCommentId === comment.id ? (
                                                <div className="flex items-start space-x-2">
                                                    <textarea
                                                        value={editingContent}
                                                        onChange={(e) => setEditingContent(e.target.value)}
                                                        className="flex-grow px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                                        rows={2}
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateComment(comment.id)}
                                                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(null);
                                                            setEditingContent('');
                                                        }}
                                                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-gray-700">{comment.content}</p>
                                            )}
                                        </div>
                                        {isCommentAuthor(comment) && editingCommentId !== comment.id && (
                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => {
                                                        setEditingCommentId(comment.id);
                                                        setEditingContent(comment.content);
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}