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

    // Normalize common backend shapes so callers can rely on a stable object
    if (data && typeof data === 'object') {
      // prefer top-level accessToken, but map common variants
      if (!data.accessToken) {
        if (typeof data.access_token === 'string') data.accessToken = data.access_token
        else if (typeof data.token === 'string') data.accessToken = data.token
        else if (data.data && typeof data.data.access_token === 'string') data.accessToken = data.data.access_token
        else if (data.data && typeof data.data.accessToken === 'string') data.accessToken = data.data.accessToken
      }

      // extract student id if present in common shapes
      if (!data.studentId) {
        if (data.student && (data.student.id || data.student._id)) data.studentId = data.student.id ?? data.student._id
        else if (data.user && (data.user.id || data.user._id)) data.studentId = data.user.id ?? data.user._id
        else if (data.data && data.data.studentId) data.studentId = data.data.studentId
      }
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

  // Métodos de storage eliminados. El estado de sesión se maneja solo en memoria.
};
