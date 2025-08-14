// src/services/studentService.ts
import { httpService } from './httpService';

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
    theoryLessonIds?: string[];
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
  teacherAssignments?: Array<{
    teacherId: string;
    scheduleSlotId: string;
    day: string;
    time: string;
    duration: number;
    createdAt?: string;
    updatedAt?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    notes?: string;
  }>;
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

<<<<<<< Updated upstream
    // Remove read-only fields from teacherAssignments to prevent backend validation errors
    if (updateData.teacherAssignments) {
      updateData.teacherAssignments = updateData.teacherAssignments.map((assignment: any) => {
        const { createdAt, updatedAt, ...cleanAssignment } = assignment;
        return cleanAssignment;
      });
    }

    // Remove read-only fields from theoryLessonAssignments if they exist
    if (updateData.theoryLessonAssignments) {
      updateData.theoryLessonAssignments = updateData.theoryLessonAssignments.map((assignment: any) => {
        const { createdAt, updatedAt, ...cleanAssignment } = assignment;
        return cleanAssignment;
      });
    }

    console.log(`Updating student with ID: ${studentId}`);
    console.log('Clean update data:', updateData);
=======
    console.log(`Updating student with ID: ${studentId}`);
    console.log('Update data:', updateData);
>>>>>>> Stashed changes

    // Use PUT method for updating
    return httpService.put(`student/${studentId}`, updateData);
  },

  async removeStudent(studentId: string): Promise<void> {
    return httpService.delete(`student/${studentId}`);
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

  // Fixed and improved updateStudentTest method
  async updateStudentTest(
    studentId: string,
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: TestStatus
  ): Promise<Student> {
    try {
      console.log(
        `Sending test update request: Student ID ${studentId}, Instrument: ${instrumentName}, Test Type: ${testType}, Status: ${status}`
      );

      // Structure the request data according to API expectations
      const requestData = {
        instrumentName,
        testType,
        status,
      };

      // Make the API call to update the test status
      const updatedStudent = await httpService.put<Student>(
        `student/${studentId}/test`,
        requestData
      );

      console.log('Test update successful, server response:', updatedStudent);
      return updatedStudent;
    } catch (error) {
      console.error('Failed to update student test status:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update test status'
      );
    }
  },
<<<<<<< Updated upstream

  // Update student instrument stage
  async updateStudentStage(
    studentId: string,
    instrumentName: string,
    stage: number
  ): Promise<Student> {
    console.log(
      `Sending stage update request: Student ID ${studentId}, Instrument: ${instrumentName}, Stage: ${stage}`
    );

    // Since backend doesn't have dedicated endpoints yet, go directly to local update
    // This avoids unnecessary 404 errors in the console
    console.log('Backend endpoints for stage update not available, using local update approach');
    
    try {
      // Get current student data
      const currentStudent = await this.getStudentById(studentId);
      
      // Update the local data to show the change
      const localUpdate = {
        ...currentStudent,
        academicInfo: {
          ...currentStudent.academicInfo,
          instrumentProgress: currentStudent.academicInfo.instrumentProgress.map(instrument => {
            if (instrument.instrumentName === instrumentName) {
              return { ...instrument, currentStage: stage };
            }
            return instrument;
          })
        }
      };

      console.log('Stage update applied locally (UI will show the change)');
      console.log('Note: Backend persistence requires implementing PUT /student/:id/stage endpoint');
      return localUpdate;
      
    } catch (error) {
      console.error('Failed to update student instrument stage:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update instrument stage'
      );
    }
  },
=======
>>>>>>> Stashed changes
};
