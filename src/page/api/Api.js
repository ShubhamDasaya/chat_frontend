import axios from "axios";

const userToken = import.meta.env.VITE_USER_TOKEN;

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_PORT,
    timeout: 10000,
});

// ===== Request Interceptor: attach JWT token =====
axiosInstance.interceptors.request.use((config) => {
    const stored = localStorage.getItem(userToken);
    if (stored) {
        const token = JSON.parse(stored)?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ===== Response Interceptor: unwrap data & handle auth errors =====
axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status;
        // Auto-logout on 401 (unauthorized) or 431 (header too large = bad token)
        if (status === 401 || status === 431) {
            localStorage.removeItem(userToken);
            window.location.href = "/";
        }
        return Promise.reject(error.response?.data);
    }
);

// ===== API Methods =====
export const getAPI = (url, params = {}) => axiosInstance.get(url, { params });
export const postAPI = (url, data = {}) => axiosInstance.post(url, data);
export const putAPI = (url, data = {}) => axiosInstance.put(url, data);
export const deleteAPI = (url) => axiosInstance.delete(url);