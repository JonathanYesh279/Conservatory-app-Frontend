import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Base URL based on environment
const BASE_URL = process.env.NODE_ENV === 'production' ? '/api/' : '//localhost:3000/api/'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies (refresh token)
  timeout: 15000 // 15 seconds timeout
})

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    
    // Avoid infinite loops
    if (!originalRequest || (originalRequest as any)._retry) {
      return Promise.reject(error)
    }

    // If error is 401 (Unauthorized), try to refresh token
    if (error.response?.status === 401) {
      try {
        // Mark as retried
        (originalRequest as any)._retry = true
        
        // Get new token
        const response = await axiosInstance.post('/auth/refresh')
        const { accessToken } = response.data
        
        // Save new token
        localStorage.setItem('accessToken', accessToken)
        
        // Update Authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Clear auth data if refresh fails
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        
        // Redirect to login (in a more sophisticated setup, this would be handled by context)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Type for params/data
type RequestData = Record<string, any> | null

// HTTP service methods
export const httpService = {
  /**
   * Perform a GET request
   * @param endpoint - API endpoint (without base URL)
   * @param params - URL parameters
   * @param config - Additional axios config
   */
  async get<T = any>(
    endpoint: string, 
    params: RequestData = null, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return ajax<T>('GET', endpoint, null, params, config)
  },
  
  /**
   * Perform a POST request
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body
   * @param config - Additional axios config
   */
  async post<T = any>(
    endpoint: string, 
    data: RequestData = null, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return ajax<T>('POST', endpoint, data, null, config)
  },
  
  /**
   * Perform a PUT request
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body
   * @param config - Additional axios config
   */
  async put<T = any>(
    endpoint: string, 
    data: RequestData = null, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return ajax<T>('PUT', endpoint, data, null, config)
  },
  
  /**
   * Perform a DELETE request
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body
   * @param config - Additional axios config
   */
  async delete<T = any>(
    endpoint: string, 
    data: RequestData = null, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return ajax<T>('DELETE', endpoint, data, null, config)
  }
}

/**
 * Generic AJAX helper function
 */
async function ajax<T = any>(
  method: string,
  endpoint: string,
  data: RequestData = null,
  params: RequestData = null,
  config: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axiosInstance({
      method,
      url: endpoint,
      data,
      params,
      ...config
    })
    
    return response.data
  } catch (err: any) {
    // Log the error
    console.error(`Error ${method} ${endpoint}:`, err)
    
    // Handle different error types
    if (err.response) {
      // The request was made and the server responded with an error status
      const errorMessage = err.response.data?.error || 'Server error'
      throw new Error(errorMessage)
    } else if (err.request) {
      // The request was made but no response was received
      throw new Error('Network error - no response received')
    } else {
      // Something happened in setting up the request
      throw new Error('Error setting up the request')
    }
  }
}