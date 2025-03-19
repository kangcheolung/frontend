// services/userCache.js
'use client';

// 사용자 정보 저장 키
const USER_CACHE_KEY = 'stitch_user_data';
const USER_AUTH_KEY = 'stitch_auth_status';

// 사용자 정보를 캐시에 저장
export const cacheUserData = (userData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        // 인증 상태도 함께 저장
        localStorage.setItem(USER_AUTH_KEY, 'true');
    }
};

// 사용자 정보 캐시에서 불러오기
export const getCachedUserData = () => {
    if (typeof window !== 'undefined') {
        const cachedData = localStorage.getItem(USER_CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : null;
    }
    return null;
};

// 캐시된 사용자 정보 확인
export const isUserCached = () => {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem(USER_CACHE_KEY);
    }
    return false;
};

// 로그인 상태 확인
export const isUserLoggedIn = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(USER_AUTH_KEY) === 'true';
    }
    return false;
};

// 캐시된 사용자 정보 삭제 (로그아웃 시 사용)
export const clearUserCache = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_AUTH_KEY);
    }
};

// 사용자 정보 특정 필드 업데이트
export const updateCachedUserField = (fieldName, value) => {
    if (typeof window !== 'undefined') {
        const userData = getCachedUserData();
        if (userData) {
            userData[fieldName] = value;
            cacheUserData(userData);
        }
    }
};