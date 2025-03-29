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
    return httpService.put(`teacher/${teacherId}`, teacher);
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
