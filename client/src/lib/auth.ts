import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  playerName?: string;
  email: string;
  playerNumber?: string;
  chapterId?: string;
  isAdmin: boolean;
  role: string;
  candles: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  playerName: string;
  email: string;
  password: string;
  chapterId?: string;
}

// Updated API base URL to use relative paths
const API_BASE = '';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("POST", `${API_BASE}/api/auth/login`, credentials);
    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("POST", `${API_BASE}/api/auth/register`, credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", `${API_BASE}/api/auth/logout`);
  },

  getCurrentUser: async (): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("GET", `${API_BASE}/api/auth/me`);
    return response.json();
  }
};