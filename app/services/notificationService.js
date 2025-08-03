// app/services/notificationService.js

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

// API 요청 로깅 헬퍼 함수
const logApiRequest = (method, url, body = null) => {
    console.log(`🌐 API 요청 [${method}]:`, {
        URL: url,
        Method: method,
        Body: body,
        Timestamp: new Date().toISOString()
    });
};

const logApiResponse = (method, url, response, data) => {
    console.log(`📡 API 응답 [${method}]:`, {
        URL: url,
        Status: response.status,
        StatusText: response.statusText,
        Headers: {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
        },
        Data: data,
        DataType: typeof data,
        DataLength: Array.isArray(data) ? data.length : 'N/A',
        Timestamp: new Date().toISOString()
    });
};

const logApiError = (method, url, error) => {
    console.error(`❌ API 오류 [${method}]:`, {
        URL: url,
        Error: error.message,
        Stack: error.stack,
        Timestamp: new Date().toISOString()
    });
};

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
            console.log('🔗 SSE 연결 시도:', { url, userCamInfoId: this.userCamInfoId });

            this.eventSource = new EventSource(url, { withCredentials: true });

            this.eventSource.onopen = () => {
                console.log('🔔 SSE 연결 성공:', { url });
                this.reconnectAttempts = 0;
            };

            this.eventSource.onmessage = (event) => {
                try {
                    console.log('📨 SSE 메시지 수신:', {
                        rawData: event.data,
                        timestamp: new Date().toISOString()
                    });

                    const notification = JSON.parse(event.data);
                    console.log('🔔 파싱된 알림:', notification);
                    this.onNotification(notification);
                } catch (error) {
                    console.error('❌ SSE 메시지 파싱 오류:', {
                        rawData: event.data,
                        error: error.message
                    });
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('🔔 SSE 연결 오류:', { error, url });
                this.handleConnectionError();
            };

        } catch (error) {
            console.error('🔔 SSE 초기화 실패:', error);
            this.onError?.(error);
        }
    }

    handleConnectionError() {
        this.eventSource?.close();

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 SSE 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}:`, {
                delay: this.reconnectDelay * this.reconnectAttempts
            });

            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ SSE 최대 재연결 시도 횟수 초과');
            this.onError?.('연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            console.log('🔌 SSE 연결 해제 완료');
        }
    }
}

export const notificationService = {
    // 사용자 알림 목록 조회
    async getUserNotifications(userCamInfoId) {
        const method = 'GET';
        const url = `${serverUrl}/api/notifications/list?userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            const notifications = data.data || data.result || [];
            console.log('✅ 알림 목록 조회 성공:', {
                count: notifications.length,
                notifications: notifications
            });

            return notifications;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 읽지 않은 알림 개수 조회
    async getUnreadCount(userCamInfoId) {
        const method = 'GET';
        const url = `${serverUrl}/api/notifications/unread-count?userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            const count = data.data || data.result || 0;
            console.log('✅ 읽지 않은 알림 개수 조회 성공:', { count });

            return count;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 알림 상세 조회
    async getNotificationDetail(notificationId, userCamInfoId) {
        const method = 'GET';
        const url = `${serverUrl}/api/notifications/detail?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 알림 읽음 처리 (개별)
    async markAsRead(notificationId, userCamInfoId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/read?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 알림 읽음 처리 성공:', { notificationId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 모든 알림 읽음 처리
    async markAllAsRead(userCamInfoId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/read/all?userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 모든 알림 읽음 처리 성공');
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 알림 삭제
    async deleteNotification(notificationId, userCamInfoId) {
        const method = 'DELETE';
        const url = `${serverUrl}/api/notifications/delete?notificationId=${notificationId}&userCamInfoId=${userCamInfoId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 알림 삭제 성공:', { notificationId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 스터디 신청 알림 생성
    async createStudyApplyNotification(receiverId, studyMemberId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/study-apply?receiverId=${receiverId}&studyMemberId=${studyMemberId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 스터디 신청 알림 생성 성공:', { receiverId, studyMemberId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 스터디 승인 알림 생성
    async createStudyApproveNotification(studyMemberId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/study-approve?studyMemberId=${studyMemberId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 스터디 승인 알림 생성 성공:', { studyMemberId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 스터디 거부 알림 생성
    async createStudyRejectNotification(studyMemberId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/study-reject?studyMemberId=${studyMemberId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 스터디 거부 알림 생성 성공:', { studyMemberId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 댓글 알림 생성
    async createCommentNotification(commentId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/study-comment?commentId=${commentId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 댓글 알림 생성 성공:', { commentId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    },

    // 새 컨텐츠 알림 생성
    async createContentNotification(studyContentId, contentWriterId) {
        const method = 'POST';
        const url = `${serverUrl}/api/notifications/study-content?studyContentId=${studyContentId}&contentWriterId=${contentWriterId}`;

        logApiRequest(method, url);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logApiResponse(method, url, response, data);

            if (data.code !== 'SUCCESS') {
                throw new Error(data.message || 'API 응답 오류');
            }

            console.log('✅ 새 컨텐츠 알림 생성 성공:', { studyContentId, contentWriterId });
            return data.data || data.result;
        } catch (error) {
            logApiError(method, url, error);
            throw error;
        }
    }
};