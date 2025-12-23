import axios from 'axios';

const apiClient = axios.create({
    // This single line works everywhere
    baseURL: '/api', 
    timeout: 15000, // Increased from 10s to 15s
    withCredentials: true,
});

export default apiClient;