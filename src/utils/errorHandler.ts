// src/utils/errorHandler.ts

/**
 * Centralized error handling utility for the application
 * Sanitizes backend errors before displaying to users while preserving debug info for developers
 */

export interface ErrorResponse {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface SanitizedError {
  userMessage: string;
  developerMessage: string;
  errorId: string;
  timestamp: Date;
  duplicateInfo?: DuplicateDetectionInfo;
}

export interface DuplicateDetectionInfo {
  blocked: boolean;
  reason: string;
  duplicates: DuplicateMatch[];
  warnings?: DuplicateMatch[];
  canOverride?: boolean;
  adminOverride?: boolean;
}

export interface DuplicateMatch {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  conflictingFields: string[];
  matches?: any[];
  note?: string;
}

/**
 * List of sensitive error patterns that should be sanitized
 */
const SENSITIVE_ERROR_PATTERNS = [
  /ValidationError:/i,
  /CastError:/i,
  /MongoError:/i,
  /mongoose/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /Failed to bulk create/i,
  /duplicate key error/i,
  /E11000/i,
  /must be one of/i,
  /Path .* is required/i,
  /Cast to ObjectId failed/i,
  /bufferedMaxEntries/i,
  /Connection/i,
  /timeout/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /stack trace/i,
  /\bat\s+.*\.(js|ts):\d+/i, // Stack trace lines
  /נמצאו התנגשויות.*תאוריה/i, // Theory lesson conflicts (Hebrew)
  /שיעורים\s+ביום\s+ראשון/i, // Specific day conflicts (Hebrew)
  /חדר\s+תאוריה\s+\d+/i, // Room conflicts (Hebrew)
  /תאריך:\s+\d{4}-\d{2}-\d{2}/i, // Date patterns (Hebrew)
  /\d{4}-\d{2}-\d{2}/i, // ISO date patterns
  /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/i, // Time range patterns
];

/**
 * Generic user-friendly error messages in Hebrew
 */
const GENERIC_ERROR_MESSAGES = {
  validation: 'נתונים לא תקינים. אנא בדוק את המידע שהוזן ונסה שוב.',
  network: 'בעיה בחיבור לשרת. אנא נסה שוב בעוד מספר רגעים.',
  server: 'שגיאה פנימית בשרת. אנא נסה שוב מאוחר יותר.',
  notFound: 'המשאב המבוקש לא נמצא.',
  unauthorized: 'אין לך הרשאות לבצע פעולה זו.',
  forbidden: 'הגישה נדחתה.',
  timeout: 'הפעולה ארכה זמן רב מדי. אנא נסה שוב.',
  conflict: 'קיים קונפליקט בנתונים. אנא רענן את הדף ונסה שוב.',
  duplicateEmail: 'כתובת האימייל הזו כבר קיימת במערכת. אנא השתמש בכתובת אימייל אחרת.',
  duplicatePhone: 'מספר הטלפון הזה כבר קיים במערכת. אנא השתמש במספר טלפון אחר.',
  duplicateStudent: 'תלמיד עם פרטים אלו כבר קיים במערכת.',
  duplicateOrchestra: 'תזמורת עם שם זה כבר קיימת במערכת.',
  duplicateTheory: 'שיעור תאוריה עם פרטים אלו כבר קיים במערכת.',
  theoryConflict: 'קיים שיעור תאוריה באותו זמן. בחר זמן אחר.',
  // Multi-field duplicate detection messages
  duplicateNamePhone: 'מורה עם שם מלא ומספר טלפון זהים כבר קיים במערכת.',
  duplicateNameAddress: 'מורה עם שם מלא וכתובת דומים כבר קיים במערכת.',
  duplicatePhoneAddress: 'מורה עם מספר טלפון וכתובת זהים כבר קיים במערכת.',
  duplicateFullProfile: 'מורה עם פרטים זהים (שם, טלפון וכתובת) כבר קיים במערכת.',
  duplicateSimilarName: 'נמצאו מורים עם שמות דומים במערכת.',
  duplicateTeacherBlocked: 'לא ניתן להוסיף מורה זה - נמצאו כפילויות משמעותיות במערכת.',
  generic: 'אירעה שגיאה. אנא נסה שוב מאוחר יותר.'
};

/**
 * Determines if an error message contains sensitive information
 */
function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects specific duplicate error types based on message content
 */
function detectDuplicateErrorType(message: string): keyof typeof GENERIC_ERROR_MESSAGES | null {
  const lowerMessage = message.toLowerCase();
  
  // Multi-field duplicate detection (most specific first)
  if (lowerMessage.includes('full_profile_duplicate') || 
      (lowerMessage.includes('name') && lowerMessage.includes('phone') && lowerMessage.includes('address'))) {
    return 'duplicateFullProfile';
  }
  
  if (lowerMessage.includes('name_phone_duplicate') || 
      (lowerMessage.includes('name') && lowerMessage.includes('phone') && !lowerMessage.includes('address'))) {
    return 'duplicateNamePhone';
  }
  
  if (lowerMessage.includes('name_address_duplicate') || 
      (lowerMessage.includes('name') && lowerMessage.includes('address') && !lowerMessage.includes('phone'))) {
    return 'duplicateNameAddress';
  }
  
  if (lowerMessage.includes('phone_address_duplicate') || 
      (lowerMessage.includes('phone') && lowerMessage.includes('address') && !lowerMessage.includes('name'))) {
    return 'duplicatePhoneAddress';
  }
  
  if (lowerMessage.includes('similar_name_duplicate')) {
    return 'duplicateSimilarName';
  }
  
  if (lowerMessage.includes('duplicate teacher detected') || lowerMessage.includes('duplicate_teacher_detected')) {
    return 'duplicateTeacherBlocked';
  }
  
  // Single field duplicates
  if (lowerMessage.includes('teacher with email') && lowerMessage.includes('already exists')) {
    return 'duplicateEmail';
  }
  if (lowerMessage.includes('user with email') && lowerMessage.includes('already exists')) {
    return 'duplicateEmail';
  }
  if (lowerMessage.includes('email') && (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists'))) {
    return 'duplicateEmail';
  }
  
  if (lowerMessage.includes('phone') && (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists'))) {
    return 'duplicatePhone';
  }
  
  // Student duplicate
  if (lowerMessage.includes('student') && (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists'))) {
    return 'duplicateStudent';
  }
  
  // Orchestra duplicate
  if (lowerMessage.includes('orchestra') && (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists'))) {
    return 'duplicateOrchestra';
  }
  
  // Theory lesson duplicate
  if (lowerMessage.includes('theory') && (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists'))) {
    return 'duplicateTheory';
  }
  
  return null;
}

/**
 * Checks if the message is already short and user-friendly
 */
function isUserFriendlyMessage(message: string): boolean {
  // If message is short (less than 80 chars) and doesn't contain technical details
  return message.length < 80 && !containsSensitiveInfo(message) && 
         !message.includes('Error:') && !message.includes('ValidationError') &&
         !message.includes('MongoError') && !message.includes('CastError');
}

/**
 * Extracts key conflict information from theory lesson error messages
 */
function parseTheoryConflictMessage(message: string): string {
  // Look for patterns in Hebrew conflict messages
  const dayMatch = message.match(/יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/i);
  const timeMatch = message.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i);
  const roomMatch = message.match(/חדר\s*תאוריה\s*(\d+|[א-ת]+)/i);
  
  if (dayMatch || timeMatch || roomMatch) {
    const conflictDetails = [];
    
    if (dayMatch) {
      conflictDetails.push(`יום ${dayMatch[1]}`);
    }
    
    if (timeMatch) {
      conflictDetails.push(`שעה ${timeMatch[1]}`);
    }
    
    if (roomMatch) {
      conflictDetails.push(`חדר ${roomMatch[1]}`);
    }
    
    if (conflictDetails.length > 0) {
      return `קיים שיעור באותו ${conflictDetails.join(' ו')}. שנה אחד מהפרטים.`;
    }
  }
  
  // Fallback for general conflicts
  return 'קיים שיעור תאוריה באותו זמן. בחר זמן או מקום אחר.';
}

/**
 * Generates a unique error ID for tracking
 */
function generateErrorId(): string {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Categorizes error based on status code or message content
 */
function categorizeError(error: ErrorResponse): keyof typeof GENERIC_ERROR_MESSAGES {
  const { status, message } = error;
  
  // Status code based categorization
  if (status) {
    switch (status) {
      case 400:
        return 'validation';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'notFound';
      case 409:
        return 'conflict';
      case 408:
      case 504:
        return 'timeout';
      case 500:
      case 502:
      case 503:
        return 'server';
      default:
        if (status >= 500) return 'server';
        if (status >= 400) return 'validation';
    }
  }
  
  // Message content based categorization
  if (message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific duplicate errors first (most specific)
    const duplicateType = detectDuplicateErrorType(message);
    if (duplicateType) {
      return duplicateType;
    }
    
    // Check for theory lesson conflicts (more specific)
    if (lowerMessage.includes('נמצאו התנגשויות') || 
        lowerMessage.includes('תאוריה') ||
        lowerMessage.includes('שיעורים ביום') ||
        lowerMessage.includes('חדר תאוריה')) {
      return 'theoryConflict';
    }
    
    if (lowerMessage.includes('validation') || lowerMessage.includes('required') || lowerMessage.includes('invalid')) {
      return 'validation';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
      return 'network';
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('token')) {
      return 'unauthorized';
    }
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('access denied')) {
      return 'forbidden';
    }
    if (lowerMessage.includes('not found')) {
      return 'notFound';
    }
    if (lowerMessage.includes('conflict') || lowerMessage.includes('duplicate')) {
      return 'conflict';
    }
  }
  
  return 'generic';
}

/**
 * Sanitizes error messages for user display
 */
export function sanitizeError(error: any): SanitizedError {
  const errorId = generateErrorId();
  const timestamp = new Date();
  
  let errorResponse: ErrorResponse;
  
  // Normalize different error formats
  if (error?.response?.data) {
    // Axios error format
    errorResponse = {
      message: error.response.data.message || error.response.data.error || error.message || 'Unknown error',
      status: error.response.status,
      code: error.response.data.code,
      details: error.response.data
    };
  } else if (error?.message) {
    // Standard Error object
    errorResponse = {
      message: error.message,
      status: error.status || error.statusCode,
      code: error.code,
      details: error
    };
  } else if (typeof error === 'string') {
    // String error
    errorResponse = {
      message: error
    };
  } else {
    // Unknown error format
    errorResponse = {
      message: 'Unknown error occurred',
      details: error
    };
  }
  
  // Check if the original message is already user-friendly
  let userMessage: string;
  if (isUserFriendlyMessage(errorResponse.message)) {
    // Use original message if it's already clean and short
    userMessage = errorResponse.message;
  } else {
    // Use generic sanitized message for technical errors
    const category = categorizeError(errorResponse);
    
    // Special handling for theory conflicts
    if (category === 'theoryConflict') {
      userMessage = parseTheoryConflictMessage(errorResponse.message);
    } else {
      userMessage = GENERIC_ERROR_MESSAGES[category];
    }
  }
  
  // Parse duplicate detection information
  const duplicateInfo = parseDuplicateDetectionInfo(errorResponse);
  
  // Create developer message with full details
  const developerMessage = `[${errorId}] ${errorResponse.message}${errorResponse.status ? ` (Status: ${errorResponse.status})` : ''}`;
  
  // Log full error details for developers (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error Handler - ${errorId}`);
    console.error('User Message:', userMessage);
    console.error('Developer Message:', developerMessage);
    console.error('Full Error:', errorResponse);
    console.error('Original Error:', error);
    if (duplicateInfo) {
      console.error('Duplicate Info:', duplicateInfo);
    }
    console.groupEnd();
  } else {
    // In production, log only essential info
    console.error(`Error ${errorId}:`, developerMessage);
  }
  
  return {
    userMessage,
    developerMessage,
    errorId,
    timestamp,
    duplicateInfo: duplicateInfo || undefined
  };
}

/**
 * Handles API errors consistently across the application
 */
export function handleApiError(error: any, context?: string): SanitizedError {
  const sanitized = sanitizeError(error);
  
  // Add context if provided
  if (context) {
    console.error(`API Error in ${context}:`, sanitized.developerMessage);
  }
  
  return sanitized;
}

/**
 * Utility function to check if an error should trigger a retry
 */
export function shouldRetry(error: any): boolean {
  const status = error?.response?.status || error?.status;
  
  // Retry on network errors and 5xx server errors
  return (
    !status || // Network errors
    status >= 500 || // Server errors
    status === 408 || // Request timeout
    status === 429 // Too many requests
  );
}

/**
 * Parses duplicate detection information from backend response
 */
function parseDuplicateDetectionInfo(errorData: any): DuplicateDetectionInfo | null {
  if (!errorData || !errorData.details) return null;
  
  const details = errorData.details;
  
  // Check if this is a duplicate detection response
  if (details.blocked !== undefined || details.duplicates || details.warnings || details.potentialDuplicates) {
    return {
      blocked: details.blocked || false,
      reason: details.reason || 'Duplicate detection triggered',
      duplicates: details.duplicates || [],
      warnings: details.warnings || details.potentialDuplicates || [],
      canOverride: details.canOverride || false,
      adminOverride: details.adminOverride || false
    };
  }
  
  return null;
}

/**
 * Utility function to get retry delay based on attempt number
 */
export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

/**
 * Hook for React components to handle errors consistently
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return handleApiError(error, context);
  };
  
  return { handleError };
}