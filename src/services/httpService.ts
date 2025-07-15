// Enhanced version of src/services/httpService.ts with better error handling and request timeout
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { sanitizeError, handleApiError } from '../utils/errorHandler';

// Base URL based on environment
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api/'
    : 'http://localhost:3001/api/';

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

    // If there's no config or it's already retried, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Initialize retry count if not present
    if (originalRequest._retry === undefined) {
      originalRequest._retry = 0;
    }

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
      console.log(
        `Retrying request (${originalRequest._retry}/${MAX_RETRIES}) after ${retryDelay}ms...`
      );

      await delay(retryDelay);
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

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
    // Use centralized error handling
    const sanitizedError = handleApiError(err, `${method} ${endpoint}`);
    
    // Throw an error with the sanitized user message
    const error = new Error(sanitizedError.userMessage);
    
    // Attach additional metadata for debugging
    (error as any).errorId = sanitizedError.errorId;
    (error as any).developerMessage = sanitizedError.developerMessage;
    (error as any).originalError = err;
    
    throw error;
  }
}
