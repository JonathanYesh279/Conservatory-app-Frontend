// Enhanced version of src/services/httpService.ts with better error handling and request timeout
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

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
      config.headers.Authorization = `Bearer ${token}`;
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
  }
}
