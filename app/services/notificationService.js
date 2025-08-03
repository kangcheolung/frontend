// app/services/notificationService.js

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

// 알림 타입 정의
export const NOTIFICATION_TYPES = {
    STUDY_APPLY: 'STUDY_APPLY',
    STUDY_APPROVE: 'STUDY_APPROVE',
    STUDY_REJECT: 'STUDY_REJECT',
    STUDY_COMMENT: 'STUDY_COMMENT',
    STUDY_CONTENT: 'STUDY_CONTENT'
};

// 알림 타입별 스타일 및 아이콘
export const getNotificationConfig = (type) => {
    const configs = {
        [NOTIFICATION_TYPES.STUDY_APPLY]: {
            icon: '📝',
            color: 'blue',
            title: '스터디 신청'
        },
        [NOTIFICATION_TYPES.STUDY_APPROVE]: {
            icon: '✅',
            color: 'green',
            title: '스터디 승인'
        },
        [NOTIFICATION_TYPES.STUDY_REJECT]: {
            icon: '❌',
            color: 'red',
            title: '스터디 거부'
        },
        [NOTIFICATION_TYPES.STUDY_COMMENT]: {
            icon: '💬',
            color: 'purple',
            title: '새 댓글'
        },
        [NOTIFICATION_TYPES.STUDY_CONTENT]: {
            icon: '📄',
            color: 'orange',
            title: '새 컨텐츠'
        }
    };
    return configs[type] || { icon: '🔔', color: 'gray', title: '알림' };
};

// SSE 연결 관리 클래스
export class NotificationSSE {
    constructor(userCamInfoId, onNotification, onError) {
        this.userCamInfoId = userCamInfoId;
        this.onNotification = onNotification;
        this.onError = onError;
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1초
    }

    connect() {
        try {
            const url = `${serverUrl}/api/notifications/sse/subscribe?userCamInfoId=${this.userCamInfoId}`;
            this.eventSource = new EventSource(url, { withCredentials: true });

            this.eventSource.onopen = () => {
                console.log('🔔 SSE 연결 성공');
                this.reconnectAttempts = 0;
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    console.log('🔔 새 알림:', notification);
                    this.onNotification(notification);
                } catch (error) {
                    console.error('알림 파싱 오류:', error);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('🔔 SSE 오류:', error);
                this.handleConnectionError();
            };

        } catch (error) {
            console.error('🔔 SSE 연결 실패:', error);
            this.onError?.(error);
        }
    }

    handleConnectionError() {
        this.eventSource?.close();

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔔 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('🔔 최대 재연결 시도 횟수 초과');
            this.onError?.('연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            console.log('🔔 SSE 연결 해제');
        }
    }
}

export const notificationService = {
    // 사용자 알림 목록 조회
    async getUserNotifications(userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/list?userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 읽지 않은 알림 개수 조회
    async getUnreadCount(userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/unread-count?userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 알림 상세 조회
    async getNotificationDetail(notificationId, userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/detail?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 알림 읽음 처리 (개별)
    async markAsRead(notificationId, userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/read?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 모든 알림 읽음 처리
    async markAllAsRead(userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/read/all?userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 알림 삭제
    async deleteNotification(notificationId, userCamInfoId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/delete?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 스터디 신청 알림 생성
    async createStudyApplyNotification(receiverId, studyMemberId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/study-apply?receiverId=${receiverId}&studyMemberId=${studyMemberId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 스터디 승인 알림 생성
    async createStudyApproveNotification(studyMemberId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/study-approve?studyMemberId=${studyMemberId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 스터디 거부 알림 생성
    async createStudyRejectNotification(studyMemberId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/study-reject?studyMemberId=${studyMemberId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 댓글 알림 생성
    async createCommentNotification(commentId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/study-comment?commentId=${commentId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    },

    // 새 컨텐츠 알림 생성
    async createContentNotification(studyContentId, contentWriterId) {
        const response = await fetch(
            `${serverUrl}/api/notifications/study-content?studyContentId=${studyContentId}&contentWriterId=${contentWriterId}`,
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
        if (data.code !== 'SUCCESS') {
            throw new Error(data.message || 'API 응답 오류');
        }

        return data.data;
    }
};