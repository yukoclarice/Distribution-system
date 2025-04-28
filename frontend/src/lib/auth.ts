import { apiClient } from './api';

// Authentication Types
export interface AuthUser {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  userType: string;
  status: string;
}

// Function to transform backend user data to frontend format
export const transformUserData = (userData: any): AuthUser => {
  return {
    id: userData.user_id || userData.id || 0,
    username: userData.username || '',
    firstName: userData.fname || userData.firstName || null,
    lastName: userData.lname || userData.lastName || null,
    // Try multiple possible field names for user type
    userType: userData.user_type || userData.userType || userData.type || 'user',
    status: userData.status || 'active'
  };
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fname?: string;
  mname?: string;
  lname?: string;
  contact_no?: string;
  user_type?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Storage Keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

// Token Management
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// User Management
export const setUser = (user: AuthUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): AuthUser | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as AuthUser;
  } catch (error) {
    // Silently handle parsing errors
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Authentication API Calls
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<any>('/auth/login', credentials);
    
    // Transform user data to match frontend format
    const transformedUser = transformUserData(response.data.user);
    
    // Create standardized response
    const authResponse: AuthResponse = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: transformedUser
    };
    
    // Save auth data
    setTokens(authResponse.accessToken, authResponse.refreshToken);
    setUser(authResponse.user);
    
    return authResponse;
  } catch (error) {
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<any>('/auth/register', data);
    
    // Transform user data to match frontend format
    const transformedUser = transformUserData(response.data.user);
    
    // Create standardized response
    const authResponse: AuthResponse = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: transformedUser
    };
    
    // Save auth data
    setTokens(authResponse.accessToken, authResponse.refreshToken);
    setUser(authResponse.user);
    
    return authResponse;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint
    const accessToken = getAccessToken();
    if (accessToken) {
      await apiClient.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }
  } catch (error) {
    // Silently handle logout errors
  } finally {
    // Clear auth data regardless of API call success
    clearTokens();
    clearUser();
  }
};

export const refreshAccessToken = async (): Promise<TokenResponse | null> => {
  try {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }
    
    const response = await apiClient.post<TokenResponse>('/auth/refresh-token', { refreshToken });
    
    // Update tokens
    setTokens(response.data.accessToken, response.data.refreshToken);
    
    return response.data;
  } catch (error) {
    // Silently handle token refresh error
    // Clear auth data on refresh failure
    clearTokens();
    clearUser();
    return null;
  }
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      return null;
    }
    
    const response = await apiClient.get<any>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    // Transform user data to match frontend format
    const transformedUser = transformUserData(response.data);
    
    // Update stored user data
    setUser(transformedUser);
    
    return transformedUser;
  } catch (error) {
    // Silently handle user fetch errors
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getUser();
}; 