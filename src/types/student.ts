// src/types/student.types.ts
import { LessonDuration } from './schedule';

export interface Student {
  _id: string;
  id?: string; // Compatibility alias for _id
  personalInfo: {
    fullName: string;
    firstName?: string; // For compatibility
    lastName?: string; // For compatibility
    phone?: string;
    age?: number;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    studentEmail?: string;
  };
  academicInfo: {
    instrument: string;
    currentStage: number;
    class: string;
    tests?: {
      stageTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה';
        lastTestDate?: string;
        nextTestDate?: string;
        notes?: string;
      };
      technicalTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה';
        lastTestDate?: string;
        nextTestDate?: string;
        notes?: string;
      };
    };
  };
  enrollments: {
    orchestraIds: string[];
    ensembleIds: string[];
    theoryLessonIds?: string[];
    schoolYears: Array<{
      schoolYearId: string;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  teacherAssignments?: Array<{
    teacherId: string;
    scheduleSlotId: string;
    day: string;
    time: string;
    duration: LessonDuration;
    location?: string;
    createdAt?: string;
    updatedAt?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    notes?: string;
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// For minimal member data (if you're only using specific fields)
export interface OrchestraMember {
  _id: string;
  personalInfo: {
    fullName: string;
  };
  academicInfo: {
    instrument: string;
  };
}
