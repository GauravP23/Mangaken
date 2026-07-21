import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}
// ─────────────────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthenticated: false,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
});

// ─── Helper: check if a JWT token is expired locally (no network) ─────────────
function isTokenExpired(token: string): boolean {
    try {
        const [, payloadB64] = token.split('.');
        const payload = JSON.parse(atob(payloadB64));
        if (!payload.exp) return false;
        // Add 10s buffer to avoid edge-case issues
        return Date.now() >= payload.exp * 1000 - 10_000;
    } catch {
        return true; // Malformed token — treat as expired
    }
}
// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ─── On mount: restore session from token ────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        // Fast local expiry check before making a network call
        if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            setLoading(false);
            return;
        }

        // Verify with server using the lightweight /verify endpoint
        apiClient.get('/auth/verify')
            .then((res) => {
                // Token valid — fetch full user info
                return apiClient.get('/auth/me');
            })
            .then((res) => {
                setUser({ id: res.data.id, username: res.data.username, email: res.data.email });
            })
            .catch(() => {
                // Token invalid or expired server-side — clean up
                localStorage.removeItem('token');
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // ─── Login ────────────────────────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string): Promise<void> => {
        // Let errors propagate so the UI can display them
        const res = await apiClient.post('/auth/login', { email, password });
        const { token, user: userData } = res.data;

        localStorage.setItem('token', token);
        setUser(userData);
        navigate('/');
    }, [navigate]);

    // ─── Register ─────────────────────────────────────────────────────────────
    const register = useCallback(async (username: string, email: string, password: string): Promise<void> => {
        // Step 1: Create account — propagates errors (duplicate email/username, validation)
        await apiClient.post('/auth/register', { username, email, password });

        // Step 2: Auto-login after successful registration
        await login(email, password);
    }, [login]);

    // ─── Logout ───────────────────────────────────────────────────────────────
    const logout = useCallback(async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Ignore network errors on logout — clean up locally regardless
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            queryClient.clear();
            navigate('/');
        }
    }, [navigate, queryClient]);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
