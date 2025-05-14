// src/services/studentService.ts
import { httpService } from './httpService';
import { Teacher } from './teacherService';

// Define interfaces for attendance data
export interface AttendanceRecord {
  date: string;
  status: 'הגיע/ה' | 'לא הגיע/ה';
  sessionId: string;
  notes?: string;
}

export interface AttendanceStats {
  attendanceRate: number;
  attended: number;
  totalRehearsals: number;
  recentHistory: AttendanceRecord[];
  message?: string;
}

export type TestStatus =
  | 'לא נבחן'
  | 'עבר/ה'
  | 'לא עבר/ה'
  | 'עבר/ה בהצטיינות'
  | 'עבר/ה בהצטיינות יתרה';

export interface InstrumentProgress {
  instrumentName: string;
  isPrimary: boolean;
  currentStage: number;
  tests: {
    stageTest?: {
      status: TestStatus;
      lastTestDate?: string;
      nextTestDate?: string;
      notes?: string;
    };
    technicalTest?: {
      status: TestStatus;
      lastTestDate?: string;
      nextTestDate?: string;
      notes?: string;
    };
  };
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
    instrument?: string;
    instrumentProgress: InstrumentProgress[];
    class: string;
    // Add these missing properties:
    teacherIds?: string[];
    orchestraIds?: string[];
    tests?: {
      stageTest?: {
        status: string;
        notes: string;
        lastTestDate?: string;
      };
      technicalTest?: {
        status: string;
        notes: string;
        lastTestDate?: string;
      };
    };
    currentStage?: number | string;
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

export interface TeacherAssignment {
  teacherId: string;
  day: string;
  time: string;
  duration: number;
  location?: string;
  isActive?: boolean;
}

// Interface for teacher schedule update with correct field names
export interface TeacherScheduleUpdate {
  studentId: string;
  day: string;
  time: string;
  duration: number;
  isActive?: boolean; // Make this optional with proper type
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

    try {
      // Use individual GET requests instead of POST to byIds endpoint
      // This is a workaround for the 404 error with the batch endpoint
      const studentPromises = studentIds.map((id) =>
        this.getStudentById(id).catch((error) => {
          console.error(`Failed to fetch student ${id}:`, error);
          return null;
        })
      );

      const results = await Promise.allSettled(studentPromises);

      // Filter out failures and nulls
      const students = results
        .filter(
          (result) => result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => (result as PromiseFulfilledResult<Student>).value);

      return students;
    } catch (error) {
      console.error('Error fetching students by IDs:', error);
      return []; // Return empty array instead of throwing
    }
  },

  async getStudentsByOrchestraId(orchestraId: string): Promise<Student[]> {
    return this.getStudents({ orchestraId });
  },

  async getStudentsByTeacherId(teacherId: string): Promise<Student[]> {
    return this.getStudents({ teacherId });
  },

  async addStudent(student: Partial<Student>): Promise<Student> {
    // Ensure we don't accidentally include an _id when creating a new student
    const { _id, ...newStudentData } = student;
    return httpService.post('student', newStudentData);
  },

  async updateStudent(
    studentId: string,
    student: Partial<Student>
  ): Promise<Student> {
    // Remove fields that are not allowed in updates
    const { createdAt, updatedAt, ...updateData } = student as any;

    // Ensure we're not sending the _id in the body when it's already in the URL
    if (updateData._id) {
      delete updateData._id;
    }

    console.log(`Updating student with ID: ${studentId}`);
    console.log('Update data:', updateData);

    // Use PUT method for updating
    return httpService.put(`student/${studentId}`, updateData);
  },

  async removeStudent(studentId: string): Promise<void> {
    return httpService.delete(`student/${studentId}`);
  },

  // Update teacher schedule with correct field names
  async updateTeacherSchedule(
    teacherId: string,
    scheduleData: TeacherScheduleUpdate
  ): Promise<Teacher> {
    const processedData = { ...scheduleData };

    // Ensure schedule data has expected format
    if (typeof processedData.isActive === 'undefined') {
      processedData.isActive = true; // Set default value if missing
    }

    console.log('Updating teacher schedule with data:', processedData);

    try {
      const response = await httpService.post<Teacher>(
        `teacher/${teacherId}/schedule`,
        processedData
      );

      // If response is incomplete but not an error, consider it successful
      if (!response || !response._id) {
        console.log(
          `Schedule updated but received partial response for teacher ${teacherId}`
        );
        // Return a valid-enough response to prevent errors
        return {
          _id: teacherId,
          personalInfo: { fullName: 'Teacher Updated' },
          isActive: true,
          roles: ['teacher'],
          teaching: {
            studentIds: [processedData.studentId],
            schedule: [
              {
                studentId: processedData.studentId,
                day: processedData.day,
                time: processedData.time,
                duration: processedData.duration,
                isActive: true,
              },
            ],
          },
        } as Teacher;
      }

      return response;
    } catch (error) {
      console.error(
        `Failed to update schedule for teacher ${teacherId}:`,
        error
      );
      throw error; // Let the caller handle this error
    }
  },

  // Get attendance stats for a student in an orchestra
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

  async updateStudentTest(
    studentId: string,
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ): Promise<Student> {
    return httpService.put(`student/${studentId}/test`, {
      instrumentName,
      testType,
      status,
    });
  },
};
