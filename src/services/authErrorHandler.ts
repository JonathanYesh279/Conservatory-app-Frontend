import { authService } from './authService';
import { handleApiError } from '../utils/errorHandler';

export interface AuthErrorCode {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED';
  TOKEN_INVALID: 'TOKEN_INVALID';
  TOKEN_REVOKED: 'TOKEN_REVOKED';
  REFRESH_FAILED: 'REFRESH_FAILED';
  SESSION_EXPIRED: 'SESSION_EXPIRED';
  UNAUTHORIZED: 'UNAUTHORIZED';
  FORBIDDEN: 'FORBIDDEN';
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED';
}

export const AUTH_ERROR_CODES: AuthErrorCode = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED'
};

export interface AuthErrorResponse {
  code: keyof AuthErrorCode;
  message: string;
  shouldRedirect: boolean;
  shouldClearAuth: boolean;
  shouldRetry: boolean;
}

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private redirectCallbacks: Array<() => void> = [];

  private constructor() {}

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  onRedirectNeeded(callback: () => void) {
    this.redirectCallbacks.push(callback);
  }

  removeRedirectCallback(callback: () => void) {
    this.redirectCallbacks = this.redirectCallbacks.filter(cb => cb !== callback);
  }

  private triggerRedirect() {
    this.redirectCallbacks.forEach(callback => callback());
  }

  handleAuthError(error: any, context?: string): AuthErrorResponse {
    const sanitizedError = handleApiError(error, context);
    const errorCode = this.categorizeAuthError(error);

    let shouldRedirect = false;
    let shouldClearAuth = false;
    let shouldRetry = false;

    switch (errorCode) {
      case AUTH_ERROR_CODES.TOKEN_EXPIRED:
        shouldRetry = true;
        break;

      case AUTH_ERROR_CODES.TOKEN_INVALID:
      case AUTH_ERROR_CODES.TOKEN_REVOKED:
      case AUTH_ERROR_CODES.REFRESH_FAILED:
      case AUTH_ERROR_CODES.SESSION_EXPIRED:
        shouldClearAuth = true;
        shouldRedirect = true;
        break;

      case AUTH_ERROR_CODES.UNAUTHORIZED:
        if (this.isTokenRelatedError(error)) {
          shouldClearAuth = true;
          shouldRedirect = true;
        }
        break;

      case AUTH_ERROR_CODES.FORBIDDEN:
        // User is authenticated but doesn't have permission
        // Don't clear auth, just show error
        break;

      case AUTH_ERROR_CODES.AUTHENTICATION_FAILED:
        shouldClearAuth = true;
        break;

      default:
        // Unknown auth error, be conservative
        shouldClearAuth = true;
        shouldRedirect = true;
        break;
    }

    if (shouldClearAuth) {
      authService.clearAuthData();
    }

    if (shouldRedirect) {
      setTimeout(() => {
        this.triggerRedirect();
      }, 100);
    }

    return {
      code: errorCode,
      message: sanitizedError.userMessage,
      shouldRedirect,
      shouldClearAuth,
      shouldRetry
    };
  }

  private categorizeAuthError(error: any): keyof AuthErrorCode {
    const status = error?.response?.status || error?.status;
    const message = error?.response?.data?.message || error?.message || '';
    const code = error?.response?.data?.code || error?.code || '';
    const lowerMessage = message.toLowerCase();

    // Check specific error codes first
    if (code === 'TOKEN_EXPIRED' || code === 'JWT_EXPIRED') {
      return AUTH_ERROR_CODES.TOKEN_EXPIRED;
    }

    if (code === 'TOKEN_INVALID' || code === 'JWT_INVALID' || code === 'JWT_MALFORMED') {
      return AUTH_ERROR_CODES.TOKEN_INVALID;
    }

    if (code === 'TOKEN_REVOKED' || code === 'TOKEN_BLACKLISTED') {
      return AUTH_ERROR_CODES.TOKEN_REVOKED;
    }

    if (code === 'REFRESH_FAILED' || code === 'REFRESH_TOKEN_EXPIRED') {
      return AUTH_ERROR_CODES.REFRESH_FAILED;
    }

    if (code === 'SESSION_EXPIRED' || code === 'SESSION_INVALID') {
      return AUTH_ERROR_CODES.SESSION_EXPIRED;
    }

    // Check status codes
    if (status === 401) {
      // Check message content for specific 401 scenarios
      if (lowerMessage.includes('token expired') || 
          lowerMessage.includes('jwt expired') ||
          lowerMessage.includes('token has expired')) {
        return AUTH_ERROR_CODES.TOKEN_EXPIRED;
      }

      if (lowerMessage.includes('invalid token') || 
          lowerMessage.includes('malformed token') ||
          lowerMessage.includes('jwt malformed')) {
        return AUTH_ERROR_CODES.TOKEN_INVALID;
      }

      if (lowerMessage.includes('session expired') || 
          lowerMessage.includes('session invalid')) {
        return AUTH_ERROR_CODES.SESSION_EXPIRED;
      }

      if (lowerMessage.includes('authentication failed') || 
          lowerMessage.includes('login failed')) {
        return AUTH_ERROR_CODES.AUTHENTICATION_FAILED;
      }

      // Generic 401
      return AUTH_ERROR_CODES.UNAUTHORIZED;
    }

    if (status === 403) {
      return AUTH_ERROR_CODES.FORBIDDEN;
    }

    // Message-based detection for cases where status might not be available
    if (lowerMessage.includes('token expired') || 
        lowerMessage.includes('jwt expired') ||
        lowerMessage.includes('התחברות פגה') ||
        lowerMessage.includes('פג תוקף')) {
      return AUTH_ERROR_CODES.TOKEN_EXPIRED;
    }

    if (lowerMessage.includes('invalid token') || 
        lowerMessage.includes('malformed token') ||
        lowerMessage.includes('jwt malformed') ||
        lowerMessage.includes('אימות לא תקין')) {
      return AUTH_ERROR_CODES.TOKEN_INVALID;
    }

    if (lowerMessage.includes('session expired') || 
        lowerMessage.includes('session invalid') ||
        lowerMessage.includes('פג תוקף הפעלה')) {
      return AUTH_ERROR_CODES.SESSION_EXPIRED;
    }

    if (lowerMessage.includes('authentication failed') || 
        lowerMessage.includes('login failed') ||
        lowerMessage.includes('שגיאה בהתחברות') ||
        lowerMessage.includes('התחברות נכשלה')) {
      return AUTH_ERROR_CODES.AUTHENTICATION_FAILED;
    }

    // Default to unauthorized for unknown auth errors
    return AUTH_ERROR_CODES.UNAUTHORIZED;
  }

  private isTokenRelatedError(error: any): boolean {
    const message = error?.response?.data?.message || error?.message || '';
    const lowerMessage = message.toLowerCase();

    return lowerMessage.includes('token') || 
           lowerMessage.includes('jwt') ||
           lowerMessage.includes('authentication') ||
           lowerMessage.includes('session');
  }

  isAuthError(error: any): boolean {
    const status = error?.response?.status || error?.status;
    const message = error?.response?.data?.message || error?.message || '';
    const lowerMessage = message.toLowerCase();

    return status === 401 || 
           status === 403 ||
           lowerMessage.includes('token') ||
           lowerMessage.includes('jwt') ||
           lowerMessage.includes('authentication') ||
           lowerMessage.includes('session') ||
           lowerMessage.includes('unauthorized') ||
           lowerMessage.includes('forbidden');
  }
}

export const authErrorHandler = AuthErrorHandler.getInstance();