import axios from 'axios';

// Get base URL from env (VITE_API_BASE_URL) or default to local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    // Required for cookies/sessions if you're using them cross-origin
    withCredentials: true,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
});

// Response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;
