// API base URL - adjust if necessary
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = {
    // Login method for authentication
    login: async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        return data;
    },

    // Helper auth method to get token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Helper auth method to set token
    setToken: (token) => {
        localStorage.setItem('token', token);
    },

    // Helper auth method to clear token
    clearToken: () => {
        localStorage.removeItem('token');
    },

    // Generic authenticated fetch
    fetchWithAuth: async (endpoint, options = {}) => {
        const token = api.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Handle unauthorized
            api.clearToken();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    },

    // Get current user details
    getCurrentUser: async () => {
        return api.fetchWithAuth('/auth/me');
    }
};
