export interface Teacher {
  _id: string;
  personalInfo: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  roles: string[];
  professionalInfo?: {
    instrument: string;
    isActive: boolean;
  };
  teaching?: {
    studentIds: string[];
    schedule: Array<{
      studentId: string;
      day: string;
      time: string;
      duration: number;
      isActive: boolean; // This is the critical field causing the error
    }>;
    timeBlocks?: Array<{
      _id: string;
      day: string;
      startTime: string;
      endTime: string;
      totalDuration: number;
      location?: string;
      notes?: string;
      isActive: boolean;
      assignedLessons?: any[];
      recurring?: {
        isRecurring: boolean;
        excludeDates?: string[];
      };
    }>;
  };
  conducting?: {
    orchestraIds: string[];
  };
  ensembleIds?: string[];
  schoolYears?: Array<{
    schoolYearId: string;
    isActive: boolean;
  }>;
  credentials?: {
    email: string;
    password?: string;
    refreshToken?: string;
    lastLogin?: string;
  };
  timeBlocks?: Array<{
    _id: string;
    day: string;
    startTime: string;
    endTime: string;
    totalDuration: number;
    location?: string;
    notes?: string;
    isActive: boolean;
    assignedLessons?: any[];
    recurring?: {
      isRecurring: boolean;
      excludeDates?: string[];
    };
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User is a simplified version of Teacher for UI display
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  roles: string[];
  avatarUrl?: string;
  professionalInfo?: {
    instrument: string;
  };
}
