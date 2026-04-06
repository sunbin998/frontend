// frontend/lib/api.ts
import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
    clearAuthTokens,
    getAccessToken,
    getRefreshToken,
    redirectToLogin,
    refreshAuthTokens,
} from "./auth";

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
    baseURL: "/api", // 自动走 Next.js 的 Proxy 转发到 :8000
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：统一处理错误（比如后端挂了）
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryRequestConfig | undefined;

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            getRefreshToken()
        ) {
            originalRequest._retry = true;
            const newAccessToken = await refreshAuthTokens();
            if (newAccessToken) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            }
        }

        if (error.response?.status === 401) {
            clearAuthTokens();
            redirectToLogin();
        }

        console.error("API Error:", error.response?.data || error.message);
        // 可以在这里触发一个全局 Toast 提示
        return Promise.reject(error);
    }
);

export default api;