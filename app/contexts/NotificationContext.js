// app/contexts/NotificationContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationSSE } from '@/app/services/notificationService';
import { getCachedUserData } from '@/app/services/userCache';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
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

    // 현재 사용자 정보
    const getCurrentUser = useCallback(() => {
        const user = getCachedUserData();
        return user?.userCamInfoId || user?.userCamInfo?.id;
    }, []);

    // 알림 목록 새로고침
    const refreshNotifications = useCallback(async () => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            setLoading(true);
            setError(null);

            const [notificationList, count] = await Promise.all([
                notificationService.getUserNotifications(userCamInfoId),
                notificationService.getUnreadCount(userCamInfoId)
            ]);

            setNotifications(notificationList);
            setUnreadCount(count);
        } catch (error) {
            console.error('알림 조회 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [getCurrentUser]);

    // 새 알림 처리
    const handleNewNotification = useCallback((notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // 브라우저 알림 표시 (권한이 있을 때)
        if (Notification.permission === 'granted') {
            new Notification(notification.message, {
                icon: '/favicon.ico',
                tag: notification.id
            });
        }
    }, []);

    // SSE 연결 관리
    const connectSSE = useCallback(() => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId || sseConnection) return;

        const sse = new NotificationSSE(
            userCamInfoId,
            handleNewNotification,
            (error) => {
                console.error('SSE 오류:', error);
                setIsConnected(false);
            }
        );

        sse.connect();
        setSseConnection(sse);
        setIsConnected(true);
    }, [getCurrentUser, handleNewNotification, sseConnection]);

    const disconnectSSE = useCallback(() => {
        if (sseConnection) {
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
            await notificationService.markAsRead(notificationId, userCamInfoId);

            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
        }
    }, [getCurrentUser]);

    // 모든 알림 읽음 처리
    const markAllAsRead = useCallback(async () => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            await notificationService.markAllAsRead(userCamInfoId);

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
        }
    }, [getCurrentUser]);

    // 알림 삭제
    const deleteNotification = useCallback(async (notificationId) => {
        const userCamInfoId = getCurrentUser();
        if (!userCamInfoId) return;

        try {
            await notificationService.deleteNotification(notificationId, userCamInfoId);

            const deletedNotification = notifications.find(n => n.id === notificationId);

            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('알림 삭제 실패:', error);
        }
    }, [getCurrentUser, notifications]);

    // 브라우저 알림 권한 요청
    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    // 초기 로드
    useEffect(() => {
        const userCamInfoId = getCurrentUser();
        if (userCamInfoId) {
            refreshNotifications();
            connectSSE();
            requestNotificationPermission();
        }

        return () => {
            disconnectSSE();
        };
    }, [getCurrentUser]);

    // 페이지 가시성 변경 시 처리
    useEffect(() => {
        const handleVisibilityChange = () => {
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

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};