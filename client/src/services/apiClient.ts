import axios from 'axios';

const apiClient = axios.create({
    // This single line works everywhere
    baseURL: '/api', 
    timeout: 10000,
    withCredentials: true,
});

export default apiClient;