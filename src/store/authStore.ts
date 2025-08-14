import { create } from 'zustand'
import { httpService } from '../services/httpService'
<<<<<<< Updated upstream
import { authService } from '../services/authService'
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  isInitialized: boolean
=======
>>>>>>> Stashed changes
  error: string | null
  
  
  // Actions
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
<<<<<<< Updated upstream
  initialize: () => Promise<void>
=======
  initialize: () => void
>>>>>>> Stashed changes
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
<<<<<<< Updated upstream
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
=======
  error: null,

  // Initialize auth state from localStorage
  initialize: () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        const user = JSON.parse(storedUser) as User;
        set({
          user,
          isAuthenticated: true,
        });
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
>>>>>>> Stashed changes
    }
  },

  // Login function
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
<<<<<<< Updated upstream
      const user = await authService.login(email, password);

      // Update state
      set({
        user,
=======
      // Make API request
      const response = await httpService.post<LoginResponse>('auth/login', {
        email,
        password,
      });

      // Store tokens and user data
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.teacher));

      // Update state
      set({
        user: response.teacher,
>>>>>>> Stashed changes
        isAuthenticated: true,
        isLoading: false,
      });

<<<<<<< Updated upstream
      return user;
=======
      return response.teacher;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
=======
      // Call logout endpoint
      await httpService.post('auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Clean up local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

>>>>>>> Stashed changes
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
