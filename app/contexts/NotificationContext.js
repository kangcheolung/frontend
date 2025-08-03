// app/contexts/NotificationContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationSSE } from '@/app/services/notificationService';
import { getCachedUserData } from '@/app/services/userCache';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        console.warn('⚠️ useNotification must be used within a NotificationProvider');
        return {
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: null,
            isConnected: false,
            refreshNotifications: () => {},
            markAsRead: () => {},
            markAllAsRead: () => {},
            deleteNotification: () => {},
            connectSSE: () => {},
            disconnectSSE: () => {},
            requestNotificationPermission: () => {}
        };
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sseConnection, setSseConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    console.log('🔔 NotificationProvider 렌더링:', {
        notifications: notifications.length,
        unreadCount,
        loading,
        error,
        isConnected
    });

    // 현재 사용자 정보
    const getCurrentUser = useCallback(() => {
        const user = getCachedUserData();
        const userCamInfoId = user?.userCamInfoId || user?.userCamInfo?.id;
        console.log('👤 getCurrentUser:', { user, userCamInfoId });
        return userCamInfoId;
    }, []);

    // 알림 목록 새로고침
    const refreshNotifications = useCallback(async () => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) {
            console.warn('⚠️ refreshNotifications: userCamInfoId가 없습니다');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('📡 API 호출 시작:', { userCamInfoId });

            const [notificationList, count] = await Promise.all([
                notificationService.getUserNotifications(userCamInfoId),
                notificationService.getUnreadCount(userCamInfoId)
            ]);

            console.log('📦 API 응답 받음:', {
                notificationList,
                count,
                listLength: notificationList?.length
            });

            setNotifications(notificationList || []);
            setUnreadCount(count || 0);

            console.log('✅ 상태 업데이트 완료:', {
                notifications: notificationList?.length || 0,
                unreadCount: count || 0
            });

        } catch (error) {
            console.error('❌ 알림 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [getCurrentUser]);

    // 새 알림 처리
    const handleNewNotification = useCallback((notification) => {
        console.log('🔔 새 알림 수신:', notification);

        setNotifications(prev => {
            const updated = [notification, ...prev];
            console.log('📝 알림 목록 업데이트:', {
                이전개수: prev.length,
                새개수: updated.length,
                새알림: notification
            });
            return updated;
        });

        setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('🔢 읽지않은 개수 업데이트:', {
                이전: prev,
                새값: newCount
            });
            return newCount;
        });

        // 브라우저 알림 표시 (권한이 있을 때)
        if (Notification.permission === 'granted') {
            console.log('🔊 브라우저 알림 표시');
            new Notification(notification.message, {
                icon: '/favicon.ico',
                tag: notification.id
            });
        }
    }, []);

    // SSE 연결 관리
    const connectSSE = useCallback(() => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId || sseConnection) {
            console.log('🔗 SSE 연결 스킵:', { userCamInfoId, hasConnection: !!sseConnection });
            return;
        }

        console.log('🔗 SSE 연결 시작:', { userCamInfoId });

        const sse = new NotificationSSE(
            userCamInfoId,
            handleNewNotification,
            (error) => {
                console.error('❌ SSE 오류:', error);
                setIsConnected(false);
            }
        );

        sse.connect();
        setSseConnection(sse);
        setIsConnected(true);

        console.log('✅ SSE 연결 설정 완료');
    }, [getCurrentUser, handleNewNotification, sseConnection]);

    const disconnectSSE = useCallback(() => {
        if (sseConnection) {
            console.log('🔌 SSE 연결 해제');
            sseConnection.disconnect();
            setSseConnection(null);
            setIsConnected(false);
        }
    }, [sseConnection]);

    // 알림 읽음 처리
    const markAsRead = useCallback(async (notificationId) => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            console.log('📖 알림 읽음 처리:', { notificationId, userCamInfoId });

            await notificationService.markAsRead(notificationId, userCamInfoId);

            setNotifications(prev => {
                const updated = prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                );
                console.log('📝 읽음 처리 후 알림 목록 업데이트');
                return updated;
            });

            setUnreadCount(prev => {
                const newCount = Math.max(0, prev - 1);
                console.log('🔢 읽음 처리 후 개수 업데이트:', { 이전: prev, 새값: newCount });
                return newCount;
            });
        } catch (error) {
            console.error('❌ 알림 읽음 처리 실패:', error);
        }
    }, [getCurrentUser]);

    // 모든 알림 읽음 처리
    const markAllAsRead = useCallback(async () => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            console.log('📖 모든 알림 읽음 처리:', { userCamInfoId });

            await notificationService.markAllAsRead(userCamInfoId);

            setNotifications(prev => {
                const updated = prev.map(notification => ({ ...notification, isRead: true }));
                console.log('📝 모든 읽음 처리 후 알림 목록 업데이트');
                return updated;
            });
            setUnreadCount(0);
            console.log('🔢 모든 읽음 처리 후 개수 0으로 설정');
        } catch (error) {
            console.error('❌ 모든 알림 읽음 처리 실패:', error);
        }
    }, [getCurrentUser]);

    // 알림 삭제
    const deleteNotification = useCallback(async (notificationId) => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            console.log('🗑️ 알림 삭제:', { notificationId, userCamInfoId });

            await notificationService.deleteNotification(notificationId, userCamInfoId);

            const deletedNotification = notifications.find(n => n.id === notificationId);

            setNotifications(prev => {
                const updated = prev.filter(n => n.id !== notificationId);
                console.log('📝 삭제 후 알림 목록 업데이트:', {
                    이전개수: prev.length,
                    새개수: updated.length
                });
                return updated;
            });

            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => {
                    const newCount = Math.max(0, prev - 1);
                    console.log('🔢 삭제 후 개수 업데이트:', { 이전: prev, 새값: newCount });
                    return newCount;
                });
            }
        } catch (error) {
            console.error('❌ 알림 삭제 실패:', error);
        }
    }, [getCurrentUser, notifications]);

    // 브라우저 알림 권한 요청
    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 브라우저 알림 권한 요청');
            const permission = await Notification.requestPermission();
            console.log('🔔 브라우저 알림 권한 결과:', permission);
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    // 초기 로드
    useEffect(() => {
        console.log('🚀 NotificationProvider 초기화 시작');
        const userCamInfoId = getCurrentUser();
        if (userCamInfoId) {
            console.log('👤 사용자 확인됨, 알림 초기화 시작');
            refreshNotifications();
            connectSSE();
            requestNotificationPermission();
        } else {
            console.warn('⚠️ 사용자 정보 없음, 알림 초기화 스킵');
        }

        return () => {
            console.log('🔌 NotificationProvider 정리');
            disconnectSSE();
        };
    }, []);

    // 페이지 가시성 변경 시 처리
    useEffect(() => {
        const handleVisibilityChange = () => {
            console.log('👁️ 페이지 가시성 변경:', { hidden: document.hidden });
            if (document.hidden) {
                disconnectSSE();
            } else {
                connectSSE();
                refreshNotifications();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [connectSSE, disconnectSSE, refreshNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        isConnected,

        // 액션들
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        connectSSE,
        disconnectSSE,
        requestNotificationPermission
    };

    console.log('🎯 NotificationProvider value:', {
        notifications: notifications.length,
        unreadCount,
        loading,
        error,
        isConnected
    });

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};