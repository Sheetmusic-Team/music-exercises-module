// types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  studentId: string;
  name: string;
}

export interface AuthContext {
  token: string | null;
  studentId: string | null;
  name: string | null;
  isAuthenticated: boolean;
}

export interface AuthState {
  auth: AuthContext;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
