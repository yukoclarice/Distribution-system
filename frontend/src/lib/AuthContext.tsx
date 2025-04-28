import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AuthUser, 
  login as loginApi, 
  logout as logoutApi, 
  register as registerApi,
  fetchCurrentUser,
  isAuthenticated as checkAuth,
  refreshAccessToken,
  LoginCredentials,
  RegisterData
} from './auth';

// Auth Context Type
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => {},
  logout: async () => {},
  error: null
};

// Create context
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state - simplified since tokens don't expire
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        if (checkAuth()) {
          // Try to get current user data
          const userData = await fetchCurrentUser();
          
          if (userData) {
            setUser(userData);
          }
          // No need for token refresh since tokens don't expire
        }
      } catch (error) {
        // Silently handle initialization errors
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginApi(credentials);
      setUser(response.user);
      return response.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerApi(data);
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await logoutApi();
      setUser(null);
    } catch (error) {
      // Silently handle logout errors
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 