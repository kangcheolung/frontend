// app/components/NotificationBell.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotification } from '@/app/contexts/NotificationContext';
import { getNotificationConfig } from '@/app/services/notificationService';

export const NotificationBell = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const {
        notifications = [],
        unreadCount = 0,
        loading = false,
        isConnected = false,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotification() || {};

    // 안전한 변수들
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const safeUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0;

    // 디버깅: 데이터 변경 감지
    useEffect(() => {
        console.log('🔔 NotificationBell 데이터 업데이트:', {
            notifications: safeNotifications.length,
            unreadCount: safeUnreadCount,
            loading,
            isConnected,
            isOpen,
            첫번째알림: safeNotifications[0]
        });
    }, [safeNotifications, safeUnreadCount, loading, isConnected, isOpen]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 알림 클릭 처리
    const handleNotificationClick = async (notification) => {
        console.log('🖱️ 알림 클릭:', notification);

        if (!notification.isRead && markAsRead) {
            console.log('📖 읽음 처리 시작:', notification.id);
            await markAsRead(notification.id);
        }

        if (notification.link) {
            console.log('🔗 링크 이동:', notification.link);
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMs = now - date;
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInHours < 1) {
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                return diffInMinutes < 1 ? '방금 전' : `${diffInMinutes}분 전`;
            } else if (diffInHours < 24) {
                return `${diffInHours}시간 전`;
            } else if (diffInDays < 7) {
                return `${diffInDays}일 전`;
            } else {
                return date.toLocaleDateString('ko-KR');
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '알 수 없음';
        }
    };

    // 알림 개별 삭제
    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        console.log('🗑️ 알림 삭제 클릭:', notificationId);

        if (deleteNotification) {
            await deleteNotification(notificationId);
        }
    };

    // 모든 알림 읽음 처리
    const handleMarkAllAsRead = async () => {
        console.log('📖 모든 알림 읽음 처리 클릭');

        if (markAllAsRead) {
            await markAllAsRead();
        }
    };

    // 드롭다운 열기/닫기
    const handleToggleDropdown = () => {
        console.log('🔽 드롭다운 토글:', { 현재상태: isOpen, 새상태: !isOpen });
        setIsOpen(!isOpen);
    };

    console.log('🎨 NotificationBell 렌더링:', {
        safeNotifications: safeNotifications.length,
        safeUnreadCount,
        loading,
        isConnected,
        isOpen
    });

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 알림 벨 버튼 */}
            <button
                onClick={handleToggleDropdown}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />

                {/* 읽지 않은 알림 개수 배지 */}
                {safeUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
                    </span>
                )}

                {/* 연결 상태 표시 */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isConnected ? 'bg-green-400' : 'bg-gray-400'
                }`} />
            </button>

            {/* 알림 드롭다운 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    {/* 헤더 */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900">
                            알림 ({safeNotifications.length})
                        </h3>
                        <div className="flex items-center space-x-2">
                            {safeUnreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                >
                                    <CheckCheck className="w-4 h-4 mr-1" />
                                    모두 읽음 ({safeUnreadCount})
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">로딩 중...</p>
                            </div>
                        ) : safeNotifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">새로운 알림이 없습니다</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    연결상태: {isConnected ? '연결됨' : '연결안됨'}
                                </p>
                            </div>
                        ) : (
                            safeNotifications.map((notification, index) => {
                                const config = getNotificationConfig(notification.type);
                                console.log(`🔔 알림 ${index + 1} 렌더링:`, notification);

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group ${
                                            !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* 알림 아이콘 */}
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100">
                                                {config.icon}
                                            </div>

                                            {/* 알림 내용 */}
                                            <div className="flex-grow min-w-0">
                                                <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(notification.createdAt)}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                {/* 디버깅 정보 */}
                                                <div className="text-xs text-gray-400 mt-1">
                                                    ID: {notification.id} | 읽음: {notification.isRead ? 'Y' : 'N'}
                                                </div>
                                            </div>

                                            {/* 삭제 버튼 */}
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 하단 */}
                    {safeNotifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => {
                                    console.log('📄 모든 알림 보기 클릭');
                                    setIsOpen(false);
                                    router.push('/notifications');
                                }}
                                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                모든 알림 보기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};