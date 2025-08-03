// app/notifications/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, Filter } from 'lucide-react';
import Layout from '@/app/components/layout/Layout';
import { useNotification } from '@/app/contexts/NotificationContext';
import { getNotificationConfig } from '@/app/services/notificationService';

export default function NotificationsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [selectedNotifications, setSelectedNotifications] = useState([]);

    const {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    } = useNotification();

    // 필터링된 알림 목록
    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread':
                return !notification.isRead;
            case 'read':
                return notification.isRead;
            default:
                return true;
        }
    });

    // 날짜 포맷팅
    const formatDate = (dateString) => {
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
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // 알림 클릭 처리
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        if (notification.link) {
            router.push(notification.link);
        }
    };

    // 선택된 알림 토글
    const toggleSelectNotification = (notificationId) => {
        setSelectedNotifications(prev =>
            prev.includes(notificationId)
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        );
    };

    // 모든 알림 선택/해제
    const toggleSelectAll = () => {
        if (selectedNotifications.length === filteredNotifications.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(filteredNotifications.map(n => n.id));
        }
    };

    // 선택된 알림 삭제
    const handleDeleteSelected = async () => {
        if (selectedNotifications.length === 0) return;

        if (confirm(`선택한 ${selectedNotifications.length}개의 알림을 삭제하시겠습니까?`)) {
            try {
                await Promise.all(
                    selectedNotifications.map(id => deleteNotification(id))
                );
                setSelectedNotifications([]);
            } catch (error) {
                alert('일부 알림 삭제에 실패했습니다.');
            }
        }
    };

    if (error) {
        return (
            <Layout requireAuth={true}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-red-800 font-medium mb-2">알림 로딩 실패</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={refreshNotifications}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            다시 시도
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout requireAuth={true}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">알림</h1>
                            <p className="text-gray-600 mt-1">
                                {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다.` : '모든 알림을 확인했습니다.'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={refreshNotifications}
                                disabled={loading}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                                title="새로고침"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4 mr-2" />
                                    모두 읽음
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 필터 및 액션 */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                                >
                                    <option value="all">전체 ({notifications.length})</option>
                                    <option value="unread">읽지 않음 ({unreadCount})</option>
                                    <option value="read">읽음 ({notifications.length - unreadCount})</option>
                                </select>
                            </div>

                            {filteredNotifications.length > 0 && (
                                <label className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.length === filteredNotifications.length}
                                        onChange={toggleSelectAll}
                                        className="mr-2"
                                    />
                                    전체 선택
                                </label>
                            )}
                        </div>

                        {selectedNotifications.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                선택 삭제 ({selectedNotifications.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* 알림 목록 */}
                <div className="space-y-2">
                    {loading && notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">알림을 불러오고 있습니다...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'unread' ? '읽지 않은 알림이 없습니다' :
                                    filter === 'read' ? '읽은 알림이 없습니다' :
                                        '알림이 없습니다'}
                            </h3>
                            <p className="text-gray-600">
                                {filter === 'all' ? '새로운 알림이 오면 여기에 표시됩니다.' :
                                    filter === 'unread' ? '모든 알림을 확인했습니다!' :
                                        '아직 읽은 알림이 없습니다.'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const config = getNotificationConfig(notification.type);
                            const isSelected = selectedNotifications.includes(notification.id);

                            return (
                                <div
                                    key={notification.id}
                                    className={`bg-white border rounded-lg transition-all duration-200 hover:shadow-md ${
                                        !notification.isRead ? 'border-l-4 border-l-indigo-500 bg-indigo-50' : 'border-gray-200'
                                    } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start space-x-3">
                                            {/* 체크박스 */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectNotification(notification.id)}
                                                className="mt-1"
                                            />

                                            {/* 알림 아이콘 */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-${config.color}-100`}>
                                                <span className="text-lg">{config.icon}</span>
                                            </div>

                                            {/* 알림 내용 */}
                                            <div
                                                className="flex-grow cursor-pointer"
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center mt-2 space-x-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
                                                                {config.title}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(notification.createdAt)}
                                                            </span>
                                                            {!notification.isRead && (
                                                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 개별 액션 버튼들 */}
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(notification.id);
                                                                }}
                                                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                                title="읽음 처리"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="삭제"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Layout>
    );
}