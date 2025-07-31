import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  playerName?: string;
  email: string;
  isAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  playerName: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("POST", "/api/auth/register", credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getCurrentUser: async (): Promise<{ user: AuthUser }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  }
};
