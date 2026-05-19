// API base URL - adjust if necessary
const getBaseApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    // In local dev, use the same hostname as the frontend page.
    // This avoids loopback/address mapping issues on some environments.
    if (import.meta.env.DEV) {
        const host = window.location.hostname && window.location.hostname !== '0.0.0.0'
            ? window.location.hostname
            : 'localhost';
        return `http://${host}:8000/api/v1`;
    }
    const hostname = window.location.hostname || '127.0.0.1';
    return `http://${hostname}:8000/api/v1`;
};

const API_URL = getBaseApiUrl();
const BASE_URL = API_URL.replace('/api/v1', '');

const parseJsonSafe = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
};

export const api = {
    baseURL: API_URL,
    rootURL: BASE_URL,
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
            const error = await parseJsonSafe(response);
            throw new Error(error?.detail || error?.message || 'Login failed');
        }

        const data = await parseJsonSafe(response);
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

    // Helper auth method to clear token and role
    clearToken: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
    },

    // Generic authenticated fetch
    fetchWithAuth: async (endpoint, options = {}) => {
        const token = api.getToken();
        
        // Ensure endpoint starts with / and API_URL doesn't end with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const url = `${baseUrl}${cleanEndpoint}`;

        const headers = { ...options.headers };

        // Only set Content-Type if not FormData (browser sets it with boundary for FormData)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            api.clearToken();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorDetail = 'Request failed';
            try {
                const error = await parseJsonSafe(response);
                errorDetail = error?.detail || error?.message || errorDetail;
            } catch (e) {
                errorDetail = `${response.status} ${response.statusText}`;
            }
            throw new Error(errorDetail);
        }

        return parseJsonSafe(response);
    },

    // Standardized upload method
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.fetchWithAuth('/complaints/upload', {
            method: 'POST',
            body: formData,
        });
    },

    // Get current user details
    getCurrentUser: async () => {
        return api.fetchWithAuth('/auth/me');
    },

    // Signup method
    signup: async (data) => {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await parseJsonSafe(response);
            throw new Error(error?.detail || error?.message || 'Signup failed');
        }

        return parseJsonSafe(response);
    },

    // Forgot password method
    forgotPassword: async (usernameOrEmail) => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username_or_email: usernameOrEmail }),
        });

        if (!response.ok) {
            const error = await parseJsonSafe(response);
            throw new Error(error?.detail || error?.message || 'Failed to send OTP');
        }

        return parseJsonSafe(response);
    },

    // Reset password method
    resetPassword: async (data) => {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await parseJsonSafe(response);
            throw new Error(error?.detail || error?.message || 'Password reset failed');
        }

        return parseJsonSafe(response);
    },

    // Get assigned role
    getUserRole: () => {
        return localStorage.getItem('userRole');
    },

    // Set assigned role
    setUserRole: (role) => {
        localStorage.setItem('userRole', role);
    },

    // Get all cases or filtered by EO
    getCases: async () => {
        return api.fetchWithAuth('/cases/');
    },

    // Submit Enquiry Action
    submitEnquiryAction: async (caseId, data) => {
        return api.fetchWithAuth(`/cases/${caseId}/enquiry-action`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
};
