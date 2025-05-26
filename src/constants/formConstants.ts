// src/constants/formConstants.ts
// This file contains constants used across multiple form components
// Extracted from useStudentForm.tsx to centralize constants

// Student form constants
export const VALID_CLASSES = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'יא',
  'יב',
  'אחר',
];

export const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8];

export const VALID_INSTRUMENTS = [
  'כינור',
  'צ׳לו',
  'ויולה',
  'קונטרבס',
  'חליל צד',
  'קלרינט',
  'אבוב',
  'בסון',
  'סקסופון',
  'חצוצרה',
  'טרומבון',
  'קרן יער',
  'טובה',
  'פסנתר',
  'גיטרה',
  'תופים',
  'הקשה',
];

export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה'];

export const EXTENDED_TEST_STATUSES = [
  'לא נבחן',
  'עבר/ה',
  'לא עבר/ה',
  'עבר/ה בהצלחה',
  'עבר/ה בהצטיינות',
  'עבר/ה בהצטיינות יתרה',
];

export const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

export const LESSON_DURATIONS = [30, 45, 60];

// Teacher assignment interface
export interface TeacherAssignment {
  teacherId: string;
  day: string;
  time: string;
  duration: number;
}

// Orchestra assignment interface
export interface OrchestraAssignment {
  orchestraId: string;
}

// Theory lesson assignment interface
export interface TheoryLessonAssignment {
  theoryLessonId: string;
}

// Define comprehensive type for student form data
export interface StudentFormData {
  _id?: string;
  personalInfo: {
    fullName: string;
    phone?: string;
    age?: number;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    studentEmail?: string;
  };
  academicInfo: {
    instrumentProgress: any[]; // Using any[] since InstrumentProgress might be defined elsewhere
    class: string;
  };
  enrollments: {
    orchestraIds: string[];
    ensembleIds: string[];
    theoryLessonIds: string[];
    schoolYears: Array<{
      schoolYearId: string;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  teacherAssignments: TeacherAssignment[];
  orchestraAssignments: OrchestraAssignment[];
  theoryLessonAssignments: TheoryLessonAssignment[];
  isActive: boolean;
}