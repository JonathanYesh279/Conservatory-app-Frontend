import { httpService } from './httpService';

// Interfaces
export interface ScheduleSlot {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0-6, where 0 is Sunday
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  location?: string;
  notes?: string;
  isRecurring: boolean;
  studentId?: string;
  studentName?: string;
}

export interface WeeklySchedule {
  [dayOfWeek: number]: ScheduleSlot[];
}

export interface StudentSchedule {
  teacherSchedules: {
    teacherId: string;
    teacherName: string;
    slots: ScheduleSlot[];
  }[];
}

export interface CreateScheduleSlotData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  studentId?: string;
}

export interface AssignStudentData {
  scheduleSlotId: string;
  studentId: string;
}

export interface UpdateScheduleSlotData {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface AvailableSlotsFilter {
  dayOfWeek?: number;
  minStartTime?: string;
  maxEndTime?: string;
  duration?: number; // in minutes
}

// API methods
export const scheduleService = {
  /**
   * Get a teacher's weekly schedule
   * @param teacherId - The ID of the teacher
   * @param includeStudentInfo - Whether to include student information in the response
   * @returns Weekly schedule object with days as keys and arrays of schedule slots as values
   */
  async getTeacherWeeklySchedule(teacherId: string, includeStudentInfo: boolean = true): Promise<WeeklySchedule> {
    return httpService.get<WeeklySchedule>(`/api/schedule/teacher/${teacherId}/weekly`, { includeStudentInfo });
  },

  /**
   * Get available slots for a teacher based on filters
   * @param teacherId - The ID of the teacher
   * @param filters - Filters to apply to the search
   * @returns Array of available schedule slots
   */
  async getAvailableSlots(teacherId: string, filters?: AvailableSlotsFilter): Promise<ScheduleSlot[]> {
    return httpService.get<ScheduleSlot[]>(`/api/schedule/teacher/${teacherId}/available`, filters);
  },

  /**
   * Create a new schedule slot for a teacher
   * @param teacherId - The ID of the teacher
   * @param slotData - The data for the new schedule slot
   * @returns The created schedule slot
   */
  async createScheduleSlot(teacherId: string, slotData: CreateScheduleSlotData): Promise<ScheduleSlot> {
    return httpService.post<ScheduleSlot>(`/api/schedule/teacher/${teacherId}/slot`, slotData);
  },

  /**
   * Assign a student to a schedule slot
   * @param assignmentData - The data for the assignment
   * @returns The updated schedule slot
   */
  async assignStudentToSlot(assignmentData: AssignStudentData): Promise<ScheduleSlot> {
    return httpService.post<ScheduleSlot>('/api/schedule/assign', assignmentData);
  },

  /**
   * Remove a student from a schedule slot
   * @param scheduleSlotId - The ID of the schedule slot
   * @returns The updated schedule slot
   */
  async removeStudentFromSlot(scheduleSlotId: string): Promise<ScheduleSlot> {
    return httpService.delete<ScheduleSlot>(`/api/schedule/assign/${scheduleSlotId}`);
  },

  /**
   * Update a schedule slot
   * @param scheduleSlotId - The ID of the schedule slot
   * @param updateData - The data to update
   * @returns The updated schedule slot
   */
  async updateScheduleSlot(scheduleSlotId: string, updateData: UpdateScheduleSlotData): Promise<ScheduleSlot> {
    return httpService.put<ScheduleSlot>(`/api/schedule/slot/${scheduleSlotId}`, updateData);
  },

  /**
   * Get a student's complete schedule
   * @param studentId - The ID of the student
   * @returns The student's schedule
   */
  async getStudentSchedule(studentId: string): Promise<StudentSchedule> {
    return httpService.get<StudentSchedule>(`/api/schedule/student/${studentId}`);
  }
};

export default scheduleService;