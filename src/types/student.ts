// src/types/student.types.ts
export interface Student {
  _id: string;
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
