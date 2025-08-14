// Enhanced version of src/services/httpService.ts with better error handling and request timeout
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
<<<<<<< Updated upstream
import { sanitizeError, handleApiError } from '../utils/errorHandler';
import { authService } from './authService';

// Base URL with cross-device support
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api/';
  }
  
  // For development, determine the correct base URL based on where the frontend is running
  const hostname = window.location.hostname;
  
  // If accessing from localhost, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/';
  }
  
  // If accessing from external device, use the machine's IP
  // You can also set VITE_API_URL environment variable to override this
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl}/api/`;
  }
  
  // Default to the Windows Wi-Fi IP for external access (mobile devices)
  return 'http://10.100.102.3:3001/api/';
};

const BASE_URL = getBaseURL();

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 HTTP Service initialized with base URL:', BASE_URL);
  console.log('🌐 Current hostname:', window.location.hostname);
}
=======

// Base URL based on environment
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api/'
    : 'http://localhost:3001/api/';
>>>>>>> Stashed changes

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies (refresh token)
  timeout: 15000, // 15 seconds timeout
});

// Add request retry mechanism
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Helper function to implement delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to track retries
// This gets attached to the config object in the retry interceptor
interface RetryConfig extends AxiosRequestConfig {
  _retry?: number;
}

<<<<<<< Updated upstream
// Helper function to check if a URL is invitation-related
const isInvitationEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('/teacher/invitation/validate') || 
         url.includes('/teacher/invitation/accept') || 
         url.includes('/teacher/invitation/resend');
};

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Skip token attachment for auth endpoints and invitation endpoints
    if (config.url?.includes('auth/refresh') || 
        config.url?.includes('auth/login') || 
        isInvitationEndpoint(config.url)) {
      return config;
    }

    const token = authService.getToken();
    if (token) {
      // Check if token is expired and try to refresh
      if (authService.isTokenExpired(token)) {
        try {
          const newToken = await authService.refreshToken();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // If refresh fails, clear auth data and let the request proceed
          authService.clearAuthData();
          // Redirect to login will be handled by response interceptor
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add debugging for token in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending request with token:', token.substring(0, 10) + '...');
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('No auth token found for request to:', config.url);
=======
// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Make sure this line is working correctly
      config.headers.Authorization = `Bearer ${token}`;

      // Add debugging for token
      console.log(
        'Sending request with token:',
        token.substring(0, 10) + '...'
      );
    } else {
      console.warn('No auth token found for request to:', config.url);
    }

    // Debug: Check if schoolYearId is being added here
    if (config.url?.includes('available-slots')) {
      console.log('Request interceptor - available-slots request config:', {
        url: config.url,
        params: config.params,
        data: config.data,
        headers: config.headers
      });
      
      if (config.params && 'schoolYearId' in config.params) {
        console.error('CONTAMINATION DETECTED in request interceptor - params contains schoolYearId:', config.params);
        console.trace();
        
        // Try to remove it here as a last resort
        delete config.params.schoolYearId;
        console.log('Removed schoolYearId from params. New params:', config.params);
      }
>>>>>>> Stashed changes
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh and retries
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig;

<<<<<<< Updated upstream
    // If there's no config, reject
=======
    // If there's no config or it's already retried, reject
>>>>>>> Stashed changes
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Initialize retry count if not present
    if (originalRequest._retry === undefined) {
      originalRequest._retry = 0;
    }

<<<<<<< Updated upstream
    // Handle 401 Unauthorized - determine if it's token expiration or auth failure
    if (error.response?.status === 401) {
      // Skip refresh for auth endpoints and invitation endpoints
      if (originalRequest.url?.includes('auth/refresh') || 
          originalRequest.url?.includes('auth/login') || 
          isInvitationEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // Only try to refresh once per request
      if (originalRequest._retry === 0) {
        try {
          originalRequest._retry = 1;
          
          // Try to refresh token using auth service
          const newToken = await authService.refreshToken();
          
          // Update Authorization header and retry
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Clear auth data and redirect to login, but skip redirect for invitation endpoints
          authService.clearAuthData();
          
          // Skip redirect for invitation-related endpoints to allow them to handle their own errors
          if (window.location.pathname !== '/login' && !isInvitationEndpoint(originalRequest.url)) {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
=======
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && originalRequest._retry === 0) {
      try {
        // Mark as retried for token refresh
        originalRequest._retry = 1;

        // Get new token
        const response = await axiosInstance.post('/auth/refresh');
        const { accessToken } = response.data;

        // Save new token
        localStorage.setItem('accessToken', accessToken);

        // Update Authorization header and retry
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Clear auth data if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        // Redirect to login (in a more sophisticated setup, this would be handled by context)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
>>>>>>> Stashed changes
      }
    }

    // For network errors or server errors (5xx), implement retry logic
    if (
      (error.code === 'ECONNABORTED' ||
        error.message.includes('timeout') ||
        error.code === 'ERR_NETWORK' ||
        (error.response && error.response.status >= 500)) &&
      originalRequest._retry < MAX_RETRIES
    ) {
      originalRequest._retry += 1;

      // Wait before retrying (with exponential backoff)
      const retryDelay = RETRY_DELAY_MS * 2 ** (originalRequest._retry - 1);
<<<<<<< Updated upstream
      
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Retrying request (${originalRequest._retry}/${MAX_RETRIES}) after ${retryDelay}ms...`
        );
      }
=======
      console.log(
        `Retrying request (${originalRequest._retry}/${MAX_RETRIES}) after ${retryDelay}ms...`
      );
>>>>>>> Stashed changes

      await delay(retryDelay);
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

<<<<<<< Updated upstream
// Response interceptor for handling password change requirements
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle password change requirement
    if (error.response?.status === 403) {
      const errorData = error.response.data as any
      if (errorData?.code === 'PASSWORD_CHANGE_REQUIRED') {
        // Store flag for password change requirement
        localStorage.setItem('requiresPasswordChange', 'true')
        // Redirect to profile page with password change flag
        window.location.href = '/profile?forcePasswordChange=true'
        return Promise.reject(new Error('Redirecting to password change'))
      }
    }

    // Handle other HTTP errors (keep existing logic)
    return Promise.reject(error)
  }
)

=======
>>>>>>> Stashed changes
// Type for params/data
type RequestData = Record<string, any> | null;

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
    return ajax<T>('GET', endpoint, null, params, config);
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
    return ajax<T>('POST', endpoint, data, null, config);
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
    return ajax<T>('PUT', endpoint, data, null, config);
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
    return ajax<T>('DELETE', endpoint, data, null, config);
  },
};

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
      ...config,
    });

    return response.data;
  } catch (err: any) {
<<<<<<< Updated upstream
    // Check if this is an expected 404 for time block endpoints that don't exist yet
    const isExpected404 = err?.response?.status === 404 && 
      (endpoint.includes('schedule/time-blocks/') && !endpoint.includes('/teacher/'));
    
    if (isExpected404) {
      // Skip error logging and handling for expected 404s on time block endpoints
      const error = new Error('Not Found');
      (error as any).originalError = err;
      throw error;
    }
    
    // Use centralized error handling for all other errors
    const sanitizedError = handleApiError(err, `${method} ${endpoint}`);
    
    // Throw an error with the sanitized user message
    const error = new Error(sanitizedError.userMessage);
    
    // Attach additional metadata for debugging
    (error as any).errorId = sanitizedError.errorId;
    (error as any).developerMessage = sanitizedError.developerMessage;
    (error as any).originalError = err;
    
    throw error;
=======
    // Log the error with more detailed information
    console.error(`Error ${method} ${endpoint}:`, {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      endpoint,
      params,
    });

    // Create a more user-friendly error message based on the type of error
    let errorMessage = 'An unexpected error occurred';

    if (err.response) {
      // The request was made and the server responded with an error status
      if (err.response.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.status === 404) {
        errorMessage = `The requested resource was not found (${endpoint})`;
      } else if (err.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (err.response.status === 401) {
        errorMessage = 'Your session has expired. Please login again';
      } else if (err.response.status === 409) {
        errorMessage = err.response.data?.message || err.response.data?.error || 'A conflict occurred - this resource already exists or conflicts with existing data';
      } else if (err.response.status >= 500) {
        errorMessage = 'A server error occurred. Please try again later';
      }
    } else if (err.request) {
      // The request was made but no response was received
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage =
          'The request timed out. Please check your connection and try again';
      } else {
        errorMessage =
          'Network error - unable to connect to the server. Please check your connection';
      }
    }

    throw new Error(errorMessage);
>>>>>>> Stashed changes
  }
}
