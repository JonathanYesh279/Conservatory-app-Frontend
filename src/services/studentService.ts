// src/services/studentService.ts
import { httpService } from './httpService';

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
    schoolYears: Array<{
      schoolYearId: string;
      isActive: boolean;
    }>;
    teachers?: Array<{
      teacherId: string;
      lessonDay?: string;
      lessonTime?: string;
      lessonDuration?: number;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFilter {
  name?: string;
  instrument?: string;
  stage?: string;
  class?: string;
  technicalTest?: string;
  stageTest?: string;
  teacherId?: string;
  orchestraId?: string;
  schoolYearId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export const studentService = {
  async getStudents(filterBy: StudentFilter = {}): Promise<Student[]> {
    return httpService.get('student', filterBy);
  },

  async getStudentById(studentId: string): Promise<Student> {
    return httpService.get(`student/${studentId}`);
  },

  async getStudentsByIds(studentIds: string[]): Promise<Student[]> {
    // If no ids provided, return empty array
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    // Fetch students with specific IDs
    // Alternative approach would be to add a new endpoint that accepts an array of IDs
    const allStudents = await this.getStudents();
    return allStudents.filter((student) => studentIds.includes(student._id));
  },

  async getStudentsByOrchestraId(orchestraId: string): Promise<Student[]> {
    return this.getStudents({ orchestraId });
  },

  async getStudentsByTeacherId(teacherId: string): Promise<Student[]> {
    return this.getStudents({ teacherId });
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    return httpService.post('student', student);
  },

  async updateStudent(
    studentId: string,
    student: Partial<Student>
  ): Promise<Student> {
    // Remove fields that are not allowed in updates according to your Joi schema
    const { _id, createdAt, updatedAt, ...updateData } = student as any;

    return httpService.put(`student/${studentId}`, updateData);
  },

  async removeStudent(studentId: string): Promise<Student> {
    return httpService.delete(`student/${studentId}`);
  },
};
