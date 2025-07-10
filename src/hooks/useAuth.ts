import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Get state and actions from auth store
  const {
    user, 
    isAuthenticated,
    isLoading, 
    error, 
    login: loginAction,
    logout: logoutAction,
    clearError
  } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string, password: string }) => {
      return loginAction(credentials.email, credentials.password)
    },
    onSuccess: () => {
      // Invalidate any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
      // Navigate to dashboard
      navigate('/dashboard')
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => logoutAction(),
    onSuccess: () => {
      // Clear the query cache
      queryClient.clear()
      // Navigate to login
      navigate('/login')
    }
  })

  // Login function
  function login(email: string, password: string) {
    clearError()
    return loginMutation.mutate({ email, password })
  }

  // Logout function
  function logout() {
    return logoutMutation.mutate()
  }

  // Combine loading states
  const combinedLoading = isLoading || 
    loginMutation.isPending || 
    logoutMutation.isPending

  // Combine error messages
  const combinedError = error || 
    loginMutation.error?.message || 
    undefined

  // Return the auth API
  return {
    user, 
    isAuthenticated,
    isLoading: combinedLoading,
    error: combinedError,
    login,
    logout,
    clearError
  }
}