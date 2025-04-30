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
  ensemblesIds?: string[];
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
  ensemblesId?: string;
  isActive?: boolean;
  showInactive?: boolean;
}

export interface TeacherScheduleUpdate {
  studentId: string;
  day: string;
  time: string;
  duration: number;
  isActive: boolean;
}

// Function to prepare data for teacher updates (excludes credentials)
function prepareTeacherForUpdate(teacher: Partial<Teacher>): Partial<Teacher> {
  // Create a new object with only the properties we want to update
  const prepared: any = {};

  // Always include these basic fields if present
  if (teacher.personalInfo) {
    prepared.personalInfo = { ...teacher.personalInfo };
  }

  // Always include roles array if present, ensure it's an array
  if (teacher.roles) {
    console.log('Including roles for update:', teacher.roles);
    prepared.roles = Array.isArray(teacher.roles) ? [...teacher.roles] : [];
  }

  if (teacher.professionalInfo) {
    prepared.professionalInfo = { ...teacher.professionalInfo };
  }

  if (teacher.isActive !== undefined) {
    prepared.isActive = teacher.isActive;
  }

  // Include conducting orchestras if present
  if (teacher.conducting) {
    prepared.conducting = {
      orchestraIds: Array.isArray(teacher.conducting.orchestraIds)
        ? [...teacher.conducting.orchestraIds]
        : [],
    };
  }

  // Include ensemblesIds if present
  if (teacher.ensemblesIds) {
    prepared.ensemblesIds = Array.isArray(teacher.ensemblesIds)
      ? [...teacher.ensemblesIds]
      : [];
  }

  // Include school years if present
  if (teacher.schoolYears) {
    prepared.schoolYears = [...teacher.schoolYears];
  }

  // Important: For updates, we exclude credentials completely
  // This is the key change from the original implementation

  // Include teaching data if present
  if (teacher.teaching) {
    prepared.teaching = {};

    // Include studentIds if present
    if (Array.isArray(teacher.teaching.studentIds)) {
      prepared.teaching.studentIds = [...teacher.teaching.studentIds];
    }

    // Include schedule if it exists and has valid items
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
        prepared.teaching.schedule = validScheduleItems.map((item) => ({
          studentId: item.studentId,
          day: item.day,
          time: item.time,
          duration: item.duration,
          // Explicitly omit isActive which is not accepted by the backend schema
        }));
      }
    }
  }

  console.log(
    'Prepared teacher data for update:',
    JSON.stringify(prepared, null, 2)
  );
  return prepared;
}

// Function to prepare data for new teacher creation (includes credentials)
function prepareNewTeacher(teacher: Partial<Teacher>): Partial<Teacher> {
  // First get the base data using the update function
  const prepared = prepareTeacherForUpdate(teacher);

  // Then add credentials for new teacher
  if (teacher.credentials) {
    prepared.credentials = {
      email: teacher.personalInfo?.email || teacher.credentials.email || '',
      password: teacher.credentials.password || '',
    };
  }

  return prepared;
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
    const prepared = prepareNewTeacher(teacher);
    console.log('Creating new teacher with data:', prepared);
    return httpService.post('teacher', prepared);
  },

  async updateTeacher(
    teacherId: string,
    teacher: Partial<Teacher>
  ): Promise<Teacher> {
    // Prepare data for update - important that we exclude credentials
    const prepared = prepareTeacherForUpdate(teacher);

    console.log('Updating teacher with prepared data:', prepared);

    // Send update request
    return httpService.put(`teacher/${teacherId}`, prepared);
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
