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
    timeBlocks?: Array<{
      _id: string;
      day: string;
      startTime: string;
      endTime: string;
      location?: string;
      notes?: string;
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
  invitationInfo?: {
    mode: 'EMAIL' | 'DEFAULT_PASSWORD';
    requiresPasswordChange: boolean;
    defaultPassword?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  placeholder?: boolean;
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


// Function to prepare data for teacher updates (excludes credentials)
function prepareTeacherForUpdate(teacher: Partial<Teacher>): Partial<Teacher> {
  // Create a new object with only the properties we want to update
  const prepared: any = {};

  // IMPORTANT: Always preserve the _id for existing teachers
  if (teacher._id) {
    prepared._id = teacher._id;
  }

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
          // Explicitly include isActive if it's defined
          ...(item.isActive !== undefined ? { isActive: item.isActive } : {}),
        }));
      }
    }

    // Include timeBlocks if present (for time block management)
    if (teacher.teaching.timeBlocks && Array.isArray(teacher.teaching.timeBlocks)) {
      prepared.teaching.timeBlocks = [...teacher.teaching.timeBlocks];
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

  // For new teachers, always include email in credentials (password will be set via invitation)
  prepared.credentials = {
    email: teacher.personalInfo?.email || teacher.credentials?.email || '',
    // Password removed - will be set via invitation system
  };

  // Always include teaching field with defaults for new teachers
  if (!prepared.teaching) {
    prepared.teaching = {
      studentIds: [],
      schedule: []
    };
  }

  return prepared;
}

// Create a placeholder teacher object for display purposes when API fails
function createPlaceholderTeacher(teacherId: string): Teacher {
  return {
    _id: teacherId,
    personalInfo: {
      fullName: 'מורה לא זמין', // "Teacher not available" in Hebrew
      phone: '',
      email: '',
    },
    professionalInfo: {
      instrument: '',
      isActive: false,
    },
    roles: ['teacher'],
    isActive: false,
    teaching: {
      studentIds: [],
      schedule: [],
    },
    // Flag this as a placeholder so UI can handle differently
    placeholder: true as any,
  };
}

export const teacherService = {
  async getTeachers(filterBy: TeacherFilter = {}): Promise<Teacher[]> {
    try {
      const response = await httpService.get('teacher', filterBy);
      
      // Handle wrapped response structure {success: true, data: [...]}
      let teachersData = response;
      if (response && response.success && response.data) {
        teachersData = response.data;
      }
      
      // Ensure we return an array
      if (!Array.isArray(teachersData)) {
        console.warn('Teachers response is not an array:', teachersData);
        return [];
      }
      
      return teachersData;
    } catch (error) {
      console.error('Failed to get teachers:', error);
      throw new Error('Failed to load teachers. Please try again later.');
    }
  },

  async getTeacherById(teacherId: string): Promise<Teacher | null> {
    // Input validation
    if (!teacherId || typeof teacherId !== 'string') {
      console.error('Invalid teacher ID provided:', teacherId);
      return null;
    }

    try {
      console.log(`Fetching teacher with ID: ${teacherId}`);
      const response = await httpService.get(`teacher/${teacherId}`);

      // Handle wrapped response structure {success: true, data: {...}}
      let teacherData = response;
      if (response && response.success && response.data) {
        teacherData = response.data;
      }

      if (!teacherData || !teacherData._id) {
        console.warn(`No valid teacher data found for ID ${teacherId}`);
        return createPlaceholderTeacher(teacherId);
      }

      console.log(`Teacher data received:`, teacherData);
      return teacherData;
    } catch (error) {
      console.error(`Failed to get teacher with ID ${teacherId}:`, error);
      // Instead of returning null, return a placeholder teacher object
      // This helps prevent UI errors when teacher data isn't available
      return createPlaceholderTeacher(teacherId);
    }
  },

  async getTeachersByIds(teacherIds: string[]): Promise<Teacher[]> {
    // If no ids provided, return empty array
    if (!teacherIds || teacherIds.length === 0) {
      return [];
    }

    try {
      // Use Promise.allSettled to handle partial failures
      const teacherPromises = teacherIds.map((id) =>
        this.getTeacherById(id).catch((err) => {
          console.error(`Failed to fetch teacher ${id}:`, err);
          return createPlaceholderTeacher(id);
        })
      );

      const results = await Promise.allSettled(teacherPromises);

      // Filter out failures
      const teachers = results
        .filter(
          (result) => result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => (result as PromiseFulfilledResult<Teacher>).value);

      return teachers;
    } catch (error) {
      console.error('Failed to fetch teachers by IDs:', error);
      // Return array of placeholder teachers instead of empty array
      return teacherIds.map((id) => createPlaceholderTeacher(id));
    }
  },

  async getTeachersByRole(role: string): Promise<Teacher[]> {
    try {
      console.log(`Fetching teachers with role '${role}' from API`);
      const response = await httpService.get(`teacher/role/${role}`);

      // Handle wrapped response structure {success: true, data: [...]}
      let teachersData = response;
      if (response && response.success && response.data) {
        teachersData = response.data;
      }

      if (!Array.isArray(teachersData)) {
        console.warn(
          `API response for getTeachersByRole is not an array:`,
          teachersData
        );
        return [];
      }

      // Filter to ensure we only get active teachers with the exact role
      const filteredTeachers = teachersData.filter(
        (teacher) =>
          teacher.isActive !== false &&
          teacher.roles &&
          teacher.roles.includes(role)
      );

      console.log(
        `Found ${filteredTeachers.length} active teachers with role '${role}'`
      );
      return filteredTeachers;
    } catch (error) {
      console.error(`Failed to get teachers with role ${role}:`, error);
      throw new Error(
        `Failed to load teachers with role ${role}. Please try again later.`
      );
    }
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
    try {
      const response = await httpService.post('teacher', prepared);
      
      // Handle wrapped response structure {success: true, data: {...}}
      let teacherData = response;
      if (response && response.success && response.data) {
        teacherData = response.data;
      }
      
      // Validate teacher data structure
      if (!teacherData || !teacherData._id || !teacherData.personalInfo) {
        console.error('Invalid teacher response structure:', {
          originalResponse: response,
          extractedData: teacherData
        });
        throw new Error('Invalid teacher data received from server');
      }
      
      console.log('Successfully created teacher:', teacherData);
      return teacherData;
    } catch (error) {
      console.error('Failed to add new teacher:', error);
      throw new Error(
        'Failed to create new teacher. Please check your inputs and try again.'
      );
    }
  },

  async updateTeacher(
    teacherId: string,
    teacher: Partial<Teacher>
  ): Promise<Teacher> {
    // Prepare data for update - important that we exclude credentials
    const prepared = prepareTeacherForUpdate(teacher);

    console.log('Updating teacher with prepared data:', prepared);

    try {
      // Send update request
      const response = await httpService.put(`teacher/${teacherId}`, prepared);
      
      // Handle wrapped response structure {success: true, data: {...}}
      let teacherData = response;
      if (response && response.success && response.data) {
        teacherData = response.data;
      }
      
      // Validate teacher data structure
      if (!teacherData || !teacherData._id || !teacherData.personalInfo) {
        console.error('Invalid teacher update response structure:', {
          originalResponse: response,
          extractedData: teacherData
        });
        throw new Error('Invalid teacher data received from server');
      }
      
      console.log('Successfully updated teacher:', teacherData);
      return teacherData;
    } catch (error) {
      console.error(`Failed to update teacher ${teacherId}:`, error);
      throw new Error(
        'Failed to update teacher information. Please try again later.'
      );
    }
  },

  async removeTeacher(teacherId: string): Promise<Teacher> {
    try {
      return await httpService.delete(`teacher/${teacherId}`);
    } catch (error) {
      console.error(`Failed to remove teacher ${teacherId}:`, error);
      throw new Error('Failed to remove teacher. Please try again later.');
    }
  },

  async addOrchestra(teacherId: string, orchestraId: string): Promise<Teacher> {
    try {
      return await httpService.post(`teacher/${teacherId}/orchestra`, {
        orchestraId,
      });
    } catch (error) {
      console.error(
        `Failed to add orchestra ${orchestraId} to teacher ${teacherId}:`,
        error
      );
      throw new Error(
        'Failed to associate orchestra with teacher. Please try again later.'
      );
    }
  },

  async removeOrchestra(
    teacherId: string,
    orchestraId: string
  ): Promise<Teacher> {
    try {
      return await httpService.delete(
        `teacher/${teacherId}/orchestra/${orchestraId}`
      );
    } catch (error) {
      console.error(
        `Failed to remove orchestra ${orchestraId} from teacher ${teacherId}:`,
        error
      );
      throw new Error(
        'Failed to remove orchestra from teacher. Please try again later.'
      );
    }
  },

  async removeStudentFromTeacher(
    teacherId: string,
    studentId: string
  ): Promise<Teacher> {
    try {
      return await httpService.delete(
        `teacher/${teacherId}/student/${studentId}`
      );
    } catch (error) {
      console.error(
        `Failed to remove student ${studentId} from teacher ${teacherId}:`,
        error
      );
      throw new Error(
        'Failed to remove student from teacher. Please try again later.'
      );
    }
  },
};
