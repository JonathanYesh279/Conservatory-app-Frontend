import { create } from 'zustand'
import { httpService } from '../services/httpService'
import { authService } from '../services/authService'
import { User } from '../types/teacher'

interface LoginResponse {
  accessToken: string;
  teacher: {
    _id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
}

// Define auth state interface
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  
  
  // Actions
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize auth state with session validation
  initialize: async () => {
    set({ isLoading: true, isInitialized: false });
    
    try {
      const isValid = await authService.validateSession();
      
      if (isValid) {
        const user = authService.getCurrentUser();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (err) {
      console.error('Session validation failed:', err);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // Login function
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(email, password);

      // Update state
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  // Logout function
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Reset state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
