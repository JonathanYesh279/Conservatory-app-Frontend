// src/services/studentService.ts
import { httpService } from './httpService'

// Define interfaces for attendance data
export interface AttendanceRecord {
  date: string
  status: 'הגיע/ה' | 'לא הגיע/ה'
  sessionId: string
  notes?: string
}

export interface AttendanceStats {
  attendanceRate: number
  attended: number
  totalRehearsals: number
  recentHistory: AttendanceRecord[]
  message?: string
}

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
    instrument: string; // Maintain for backward compatibility
    instruments?: string[]; // New field for multiple instruments
    currentStage: number;
    class: string;
    tests?: {
      stageTest?: {
        status:
          | 'לא נבחן'
          | 'עבר/ה'
          | 'לא עבר/ה'
          | 'עבר/ה בהצלחה'
          | 'עבר/ה בהצטיינות';
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
      day?: string;
      time?: string;
      duration?: number;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  _newTeacherAssociation?: boolean;
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

// Interface for teacher schedule update with correct field names
export interface TeacherScheduleUpdate {
  studentId: string;
  day: string;
  time: string;
  duration: number;
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

  // Update teacher schedule with correct field names
  async updateTeacherSchedule(
    teacherId: string,
    scheduleData: TeacherScheduleUpdate
  ): Promise<any> {
    // Validate data before sending to backend
    if (
      !scheduleData.studentId ||
      !scheduleData.day ||
      !scheduleData.time ||
      !scheduleData.duration
    ) {
      throw new Error('Invalid schedule data: All fields are required');
    }

    console.log(`Updating teacher ${teacherId} schedule with:`, scheduleData);
    return httpService.post(`teacher/${teacherId}/schedule`, scheduleData);
  },

  // New function to get attendance stats for a student in an orchestra
  async getStudentAttendanceStats(
    orchestraId: string,
    studentId: string
  ): Promise<AttendanceStats> {
    try {
      return httpService.get(
        `orchestra/${orchestraId}/student/${studentId}/attendance`
      );
    } catch (error) {
      console.error('Failed to get student attendance stats:', error);
      // Return default empty stats on error
      return {
        attendanceRate: 0,
        attended: 0,
        totalRehearsals: 0,
        recentHistory: [],
        message: 'Failed to load attendance data',
      };
    }
  },
};