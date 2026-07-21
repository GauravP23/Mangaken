import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 20000, // 20s to handle cold Render start-ups
    withCredentials: true,
});

// ─── Request interceptor: auto-attach JWT from localStorage ──────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 (expired / invalid token) ──────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stale credentials
            localStorage.removeItem('token');
            delete apiClient.defaults.headers.common['Authorization'];

            // Redirect to login only if not already there
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;