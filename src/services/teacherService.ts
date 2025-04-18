// src/services/teacherService.ts
import { httpService } from './httpService';

export interface Teacher {
  _id: string;
  personalInfo: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  professionalInfo?: {
    instrument: string;
    isActive: boolean;
  };
  roles: string[];
  teaching?: {
    studentIds: string[];
    schedule: Array<{
      studentId: string;
      day: string;
      time: string;
      duration: number;
      isActive: boolean;
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
    refreshToken?: string;
    lastLogin?: string;
    password?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherFilter {
  name?: string;
  role?: string;
  instrument?: string;
  studentId?: string;
  orchestraId?: string;
  ensembleId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export interface TeacherScheduleUpdate {
  studentId: string;
  lessonDay: string;
  lessonTime: string;
  lessonDuration: number;
  isActive: boolean;
}

// Function to sanitize teacher data before sending to backend
function sanitizeTeacherForUpdate(teacher: Partial<Teacher>): Partial<Teacher> {
  // Create a new object with only the properties we want to update
  const sanitized: any = {};

  // Always include these basic fields if present
  if (teacher.personalInfo) {
    sanitized.personalInfo = { ...teacher.personalInfo };
  }

  if (teacher.roles) {
    sanitized.roles = [...teacher.roles];
  }

  if (teacher.professionalInfo) {
    sanitized.professionalInfo = { ...teacher.professionalInfo };
  }

  if (teacher.isActive !== undefined) {
    sanitized.isActive = teacher.isActive;
  }

  // Include conducting orchestras if present
  if (teacher.conducting?.orchestraIds) {
    sanitized.conducting = {
      orchestraIds: [...teacher.conducting.orchestraIds],
    };
  }

  // Include school years if present
  if (teacher.schoolYears) {
    sanitized.schoolYears = [...teacher.schoolYears];
  }

  // IMPORTANT: Always include credentials with both email and password
  sanitized.credentials = {
    email: teacher.personalInfo?.email || teacher.credentials?.email || '',
    password:
      teacher.credentials?.password !== '********' &&
      teacher.credentials?.password
        ? teacher.credentials.password
        : 'placeholder_password', // Use a placeholder that won't actually change the password
  };

  // IMPORTANT: Only include teaching.schedule if the items have all required fields
  if (teacher.teaching) {
    // Always include studentIds
    sanitized.teaching = {
      studentIds: [...(teacher.teaching.studentIds || [])],
    };

    // Only include schedule if it exists and has valid items
    if (teacher.teaching.schedule && teacher.teaching.schedule.length > 0) {
      // Filter out any invalid schedule items
      const validScheduleItems = teacher.teaching.schedule.filter(
        (item) =>
          item.studentId &&
          item.day &&
          item.time &&
          typeof item.duration === 'number' &&
          [30, 45, 60].includes(item.duration)
      );

      // Only add schedule to the payload if there are valid items
      if (validScheduleItems.length > 0) {
        sanitized.teaching.schedule = validScheduleItems.map((item) => ({
          studentId: item.studentId,
          day: item.day,
          time: item.time,
          duration: item.duration,
          // Explicitly omit isActive which is not accepted by the backend schema
        }));
      } else {
        // If no valid schedule items, send an empty array to clear existing schedule
        sanitized.teaching.schedule = [];
      }
    } else {
      // If no schedule, include an empty array
      sanitized.teaching.schedule = [];
    }
  }

  console.log('Sanitized teacher data:', JSON.stringify(sanitized, null, 2));
  return sanitized;
}

export const teacherService = {
  async getTeachers(filterBy: TeacherFilter = {}): Promise<Teacher[]> {
    return httpService.get('teacher', filterBy);
  },

  async getTeacherById(teacherId: string): Promise<Teacher> {
    return httpService.get(`teacher/${teacherId}`);
  },

  async getTeachersByIds(teacherIds: string[]): Promise<Teacher[]> {
    // If no ids provided, return empty array
    if (!teacherIds || teacherIds.length === 0) {
      return [];
    }

    // Fetch teachers with specific IDs
    const allTeachers = await this.getTeachers();
    return allTeachers.filter((teacher) => teacherIds.includes(teacher._id));
  },

  async getTeachersByRole(role: string): Promise<Teacher[]> {
    return httpService.get(`teacher/role/${role}`);
  },

  async getTeachersByOrchestraId(orchestraId: string): Promise<Teacher[]> {
    return this.getTeachers({ orchestraId });
  },

  async getTeachersByStudentId(studentId: string): Promise<Teacher[]> {
    return this.getTeachers({ studentId });
  },

  async addTeacher(teacher: Partial<Teacher>): Promise<Teacher> {
    return httpService.post('teacher', teacher);
  },

  async updateTeacher(
    teacherId: string,
    teacher: Partial<Teacher>
  ): Promise<Teacher> {
    // Make sure we're not sending the _id in the request body
    const { _id, ...teacherWithoutId } = teacher as any;

    // Sanitize data before sending to backend
    const sanitizedTeacher = sanitizeTeacherForUpdate(teacherWithoutId);

    return httpService.put(`teacher/${teacherId}`, sanitizedTeacher);
  },

  async removeTeacher(teacherId: string): Promise<Teacher> {
    return httpService.delete(`teacher/${teacherId}`);
  },

  async updateTeacherSchedule(
    teacherId: string,
    scheduleData: TeacherScheduleUpdate
  ): Promise<Teacher> {
    return httpService.post(`teacher/${teacherId}/schedule`, scheduleData);
  },

  async addOrchestra(teacherId: string, orchestraId: string): Promise<Teacher> {
    return httpService.post(`teacher/${teacherId}/orchestra`, { orchestraId });
  },

  async removeOrchestra(
    teacherId: string,
    orchestraId: string
  ): Promise<Teacher> {
    return httpService.delete(`teacher/${teacherId}/orchestra/${orchestraId}`);
  },
};
