import { create } from 'zustand'
import { httpService } from '../services/httpService'
import { User } from '../types/teacher'

// Define auth state interface
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  initialize: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth state from localStorage
  initialize: function() {
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (storedUser && accessToken) {
      try {
        const user = JSON.parse(storedUser) as User
        set({ 
          user, 
          isAuthenticated: true 
        })
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
      }
    }
  },

  // Login function
  login: async function(email, password) {
    set({ isLoading: true, error: null })
    try {
      // Make API request
      const response = await httpService.post<LoginResponse>('auth/login', { email, password })
      
      // Store tokens and user data
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.teacher))
      
      // Update state
      set({ 
        user: response.teacher, 
        isAuthenticated: true, 
        isLoading: false
      })
      
      return response.teacher
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      set({ error: errorMessage, isLoading: false })
      throw err
    }
  },

  // Logout function
  logout: async function() {
    set({ isLoading: true })
    try {
      // Call logout endpoint
      await httpService.post('auth/logout')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      // Clean up local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      
      // Reset state
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false
      })
    }
  },

  // Clear error
  clearError: function() {
    set({ error: null })
  }
}))

// Initialize on import
useAuthStore.getState().initialize()