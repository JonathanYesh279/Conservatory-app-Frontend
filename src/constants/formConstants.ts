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
<<<<<<< Updated upstream
  'אבוב',
  'בסון',
  'חלילית',
  'חצוצרה',
  'טובה/בריטון',
  'טרומבון',
  'סקסופון',
  'קלרינט',
  'קרן יער',
  'פסנתר',
=======
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
>>>>>>> Stashed changes
];

export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה'];

export const EXTENDED_TEST_STATUSES = [
  'לא נבחן',
  'עבר/ה',
  'לא עבר/ה',
<<<<<<< Updated upstream
=======
  'עבר/ה בהצלחה',
>>>>>>> Stashed changes
  'עבר/ה בהצטיינות',
  'עבר/ה בהצטיינות יתרה',
];

import { HebrewDayName, HEBREW_DAYS, LessonDuration } from '../types/schedule';

export const DAYS_OF_WEEK: HebrewDayName[] = [
  HEBREW_DAYS.SUNDAY,
  HEBREW_DAYS.MONDAY,
  HEBREW_DAYS.TUESDAY,
  HEBREW_DAYS.WEDNESDAY,
  HEBREW_DAYS.THURSDAY,
  HEBREW_DAYS.FRIDAY,
];

export const LESSON_DURATIONS: LessonDuration[] = [30, 45, 60];

// Teacher assignment interface - updated to use schedule types
export interface TeacherAssignment {
  teacherId: string;
  scheduleSlotId?: string; // Link to actual schedule slot
  day: HebrewDayName;
  time: string;
  duration: LessonDuration;
  location?: string;
  notes?: string;
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
    age?: number | string;
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