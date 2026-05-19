// services/auth/authClient.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const authClient = {
  async login(email: string, password: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Try to parse response body for better error messages
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const msg = data && typeof data === 'object' ? (data.error || data.message || JSON.stringify(data)) : (String(data) || 'Login failed');
      throw new Error(msg);
    }

    return data;
  },

  async signup(email: string, password: string, name: string) {
    const response = await fetch(`${BACKEND_URL}/api/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create account');
    }

    return response.json();
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    localStorage.removeItem('name');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getStudentId() {
    return localStorage.getItem('studentId');
  },

  getName() {
    return localStorage.getItem('name');
  },

  setAuth(token: string, studentId: string, name: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('studentId', studentId);
    localStorage.setItem('name', name);
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
