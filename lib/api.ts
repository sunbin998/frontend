// frontend/lib/api.ts
import axios from "axios";

const api = axios.create({
    baseURL: "/api", // 自动走 Next.js 的 Proxy 转发到 :8000
    headers: {
        "Content-Type": "application/json",
    },
});

// 响应拦截器：统一处理错误（比如后端挂了）
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);
        // 可以在这里触发一个全局 Toast 提示
        return Promise.reject(error);
    }
);

export default api;