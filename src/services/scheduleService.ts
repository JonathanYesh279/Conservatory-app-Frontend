import { httpService } from './httpService';
import { timeToMinutes, minutesToTime } from '../utils/scheduleUtils';
import {
  ScheduleSlot,
  WeeklySchedule,
  StudentSchedule,
  TeacherSchedule,
  CreateScheduleSlotRequest,
  UpdateScheduleSlotRequest,
  AssignStudentRequest,
  GetAvailableSlotsRequest,
  ScheduleApiResponse,
  BackendScheduleSlot,
  BackendTeacherSchedule,
  ScheduleFilters,
  // Time Block System Imports
  TimeBlock,
  LessonAssignment,
  AvailableSlot,
  CreateTimeBlockRequest,
  UpdateTimeBlockRequest,
  AssignLessonRequest,
  RescheduleLessonRequest,
  SlotSearchCriteria,
  TeacherScheduleStats,
  LessonDurationMinutes,
  HebrewDayName,
  StudentSlotPreferences,
  HEBREW_TO_NUMERIC_DAYS,
} from '../types/schedule';
import {
  transformBackendSlotToFrontend,
  transformBackendTeacherSchedule,
  transformFormDataToCreateRequest,
  transformFormDataToUpdateRequest,
  groupSlotsByDay,
} from '../utils/scheduleTransformations';

// Helper function to handle API response transformation
const handleApiResponse = async <T>(
  apiCall: Promise<ScheduleApiResponse<T>>
): Promise<T> => {
  try {
    const response = await apiCall;
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error.message || 'API request failed');
    }
  } catch (error) {
    console.error('Schedule API Error:', error);
    throw error;
  }
};

// API methods
export const scheduleService = {
  /**
   * Get a teacher's weekly schedule
   * @param teacherId - The ID of the teacher
   * @param includeStudentInfo - Whether to include student information in the response
   * @returns Weekly schedule object with days as keys and arrays of schedule slots as values
   */
  async getTeacherWeeklySchedule(
    teacherId: string,
    includeStudentInfo: boolean = true
  ): Promise<WeeklySchedule> {
    try {
      const response = await httpService.get<BackendTeacherSchedule>(
        `schedule/teacher/${teacherId}/weekly`,
        { includeStudentInfo }
      );
      
      // Transform backend response to frontend format
      const teacherSchedule = transformBackendTeacherSchedule(response);
      return teacherSchedule.weeklySchedule;
    } catch (error) {
      console.error('Failed to get teacher weekly schedule:', error);
      throw new Error('שגיאה בטעינת מערכת השעות של המורה');
    }
  },

  /**
   * Get complete teacher schedule with metadata
   * @param teacherId - The ID of the teacher
   * @param includeStudentInfo - Whether to include student information
   * @returns Complete teacher schedule with statistics
   */
  async getTeacherSchedule(
    teacherId: string,
    includeStudentInfo: boolean = true
  ): Promise<TeacherSchedule> {
    try {
      const response = await httpService.get<BackendTeacherSchedule>(
        `schedule/teacher/${teacherId}`,
        { includeStudentInfo }
      );
      
      return transformBackendTeacherSchedule(response);
    } catch (error) {
      console.error('Failed to get teacher schedule:', error);
      throw new Error('שגיאה בטעינת מערכת השעות של המורה');
    }
  },

  /**
   * Get available slots for a teacher based on filters
   * @param teacherId - The ID of the teacher
   * @param filters - Filters to apply to the search
   * @returns Array of available schedule slots
   */
  async getAvailableSlots(
    teacherId: string,
    filters?: Partial<GetAvailableSlotsRequest>
  ): Promise<ScheduleSlot[]> {
    try {
      const params = {
        teacherId,
        ...filters,
      };
      
      // First try to get regular available slots
      let response: BackendScheduleSlot[] = [];
      try {
        response = await httpService.get<BackendScheduleSlot[]>(
          `schedule/teacher/${teacherId}/available`,
          params
        );
      } catch (apiError) {
        // API endpoint not available, will try time blocks conversion
      }
      
      // If no slots found, try to get teacher time blocks and convert them
      if (response.length === 0) {
        try {
          // Get teacher data with time blocks
          const { teacherService } = await import('./teacherService');
          const teacherData = await teacherService.getTeacherById(teacherId);
          
          // Check both possible locations for time blocks
          const timeBlocks = (teacherData as any)?.timeBlocks || (teacherData as any)?.teaching?.timeBlocks;
          
          if (teacherData && timeBlocks && timeBlocks.length > 0) {
            
            // Convert time blocks to available slots format
            const convertedSlots: ScheduleSlot[] = timeBlocks.flatMap((timeBlock: any) => {
              // Create slots for each possible lesson time within the time block
              const slotDuration = filters?.duration || 60; // Default 60 minutes
              const totalMinutes = timeBlock.totalDuration || 0;
              const slotsCount = Math.floor(totalMinutes / slotDuration);
              
              const convertedBlockSlots: ScheduleSlot[] = [];
              
              // Convert Hebrew day to numeric day
              const dayMap: Record<string, number> = {
                'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 
                'חמישי': 4, 'שישי': 5, 'שבת': 6
              };
              
              const dayOfWeek = dayMap[timeBlock.day] ?? 0;
              
              // Generate available slots within the time block
              for (let i = 0; i < slotsCount; i++) {
                const [startHour, startMinute] = timeBlock.startTime.split(':').map(Number);
                const slotStartMinutes = (startHour * 60 + startMinute) + (i * slotDuration);
                const slotEndMinutes = slotStartMinutes + slotDuration;
                
                // Make sure we don't exceed the time block end time
                const [endHour, endMinute] = timeBlock.endTime.split(':').map(Number);
                const blockEndMinutes = endHour * 60 + endMinute;
                
                if (slotEndMinutes <= blockEndMinutes) {
                  const slotStartHour = Math.floor(slotStartMinutes / 60);
                  const slotStartMin = slotStartMinutes % 60;
                  const slotEndHour = Math.floor(slotEndMinutes / 60);
                  const slotEndMin = slotEndMinutes % 60;
                  
                  const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;
                  const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
                  
                  convertedBlockSlots.push({
                    id: `${timeBlock._id}-slot-${i}`,
                    teacherId: teacherId,
                    teacherName: teacherData.personalInfo?.fullName || '',
                    dayOfWeek: dayOfWeek,
                    startTime: slotStartTime,
                    endTime: slotEndTime,
                    duration: slotDuration,
                    location: timeBlock.location || '',
                    isRecurring: timeBlock.recurring?.isRecurring || false,
                    isActive: timeBlock.isActive,
                    studentId: undefined, // Available slot
                    studentName: undefined,
                    notes: timeBlock.notes || ''
                  });
                }
              }
              
              return convertedBlockSlots;
            });
            
            // Successfully converted time blocks to available slots
            return convertedSlots;
          }
        } catch (timeBlockError) {
          console.warn('Failed to load time blocks, using empty slots array:', timeBlockError);
        }
      }
      
      // Transform backend slots to frontend format
      return response.map(transformBackendSlotToFrontend);
    } catch (error) {
      console.error('Failed to get available slots:', error);
      throw new Error('שגיאה בטעינת השעות הזמינות');
    }
  },

  /**
   * Create a new schedule slot for a teacher
   * @param teacherId - The ID of the teacher
   * @param slotData - The data for the new schedule slot
   * @returns The created schedule slot
   */
  async createScheduleSlot(
    teacherId: string,
    slotData: CreateScheduleSlotRequest
  ): Promise<ScheduleSlot> {
    try {
      const response = await httpService.post<BackendScheduleSlot>(
        `schedule/teacher/${teacherId}/slot`,
        slotData
      );
      
      return transformBackendSlotToFrontend(response);
    } catch (error) {
      console.error('Failed to create schedule slot:', error);
      throw new Error('שגיאה ביצירת משבצת זמן חדשה');
    }
  },

  /**
   * Update a schedule slot
   * @param scheduleSlotId - The ID of the schedule slot
   * @param updateData - The data to update
   * @returns The updated schedule slot
   */
  async updateScheduleSlot(
    scheduleSlotId: string,
    updateData: UpdateScheduleSlotRequest
  ): Promise<ScheduleSlot> {
    try {
      const response = await httpService.put<BackendScheduleSlot>(
        `schedule/slot/${scheduleSlotId}`,
        updateData
      );
      
      return transformBackendSlotToFrontend(response);
    } catch (error) {
      console.error('Failed to update schedule slot:', error);
      throw new Error('שגיאה בעדכון משבצת הזמן');
    }
  },

  /**
   * Delete a schedule slot
   * @param scheduleSlotId - The ID of the schedule slot
   * @returns Success status
   */
  async deleteScheduleSlot(scheduleSlotId: string): Promise<boolean> {
    try {
      await httpService.delete(`schedule/slot/${scheduleSlotId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete schedule slot:', error);
      throw new Error('שגיאה במחיקת משבצת הזמן');
    }
  },

  /**
   * Assign a student to a schedule slot
   * @param assignmentData - The data for the assignment
   * @returns The updated schedule slot
   */
  async assignStudentToSlot(assignmentData: AssignStudentRequest): Promise<ScheduleSlot> {
    try {
      const response = await httpService.post<BackendScheduleSlot>(
        'schedule/assign',
        assignmentData
      );
      
      return transformBackendSlotToFrontend(response);
    } catch (error) {
      console.error('Failed to assign student to slot:', error);
      throw new Error('שגיאה בשיוך התלמיד למשבצת הזמן');
    }
  },

  /**
   * Remove a student from a schedule slot
   * @param scheduleSlotId - The ID of the schedule slot
   * @returns The updated schedule slot
   */
  async removeStudentFromSlot(scheduleSlotId: string): Promise<ScheduleSlot> {
    try {
      const response = await httpService.delete<BackendScheduleSlot>(
        `schedule/assign/${scheduleSlotId}`
      );
      
      return transformBackendSlotToFrontend(response);
    } catch (error) {
      console.error('Failed to remove student from slot:', error);
      throw new Error('שגיאה בהסרת התלמיד ממשבצת הזמן');
    }
  },

  /**
   * Get a student's complete schedule
   * @param studentId - The ID of the student
   * @returns The student's schedule
   */
  async getStudentSchedule(studentId: string): Promise<StudentSchedule> {
    try {
      const response = await httpService.get<StudentSchedule>(
        `schedule/student/${studentId}`
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get student schedule:', error);
      throw new Error('שגיאה בטעינת מערכת השעות של התלמיד');
    }
  },

  /**
   * Search schedule slots with filters
   * @param filters - Search filters
   * @returns Array of matching schedule slots
   */
  async searchScheduleSlots(filters: ScheduleFilters): Promise<ScheduleSlot[]> {
    try {
      const response = await httpService.get<BackendScheduleSlot[]>(
        'schedule/search',
        filters
      );
      
      return response.map(transformBackendSlotToFrontend);
    } catch (error) {
      console.error('Failed to search schedule slots:', error);
      throw new Error('שגיאה בחיפוש משבצות זמן');
    }
  },

  /**
   * Get schedule conflicts for a teacher
   * @param teacherId - The ID of the teacher
   * @returns Array of conflicting slots
   */
  async getScheduleConflicts(teacherId: string): Promise<ScheduleSlot[]> {
    try {
      const response = await httpService.get<BackendScheduleSlot[]>(
        `schedule/teacher/${teacherId}/conflicts`
      );
      
      return response.map(transformBackendSlotToFrontend);
    } catch (error) {
      console.error('Failed to get schedule conflicts:', error);
      throw new Error('שגיאה בטעינת התנגשויות במערכת השעות');
    }
  },

  /**
   * Bulk assign students to multiple slots
   * @param assignments - Array of assignment data
   * @returns Array of updated slots
   */
  async bulkAssignStudents(assignments: AssignStudentRequest[]): Promise<ScheduleSlot[]> {
    try {
      const response = await httpService.post<{ slots: BackendScheduleSlot[] }>(
        'schedule/bulk-assign',
        { assignments }
      );
      
      return response.slots.map(transformBackendSlotToFrontend);
    } catch (error) {
      console.error('Failed to bulk assign students:', error);
      throw new Error('שגיאה בשיוך מרובה של תלמידים');
    }
  },

  /**
   * Get schedule statistics for a teacher
   * @param teacherId - The ID of the teacher
   * @returns Schedule statistics
   */
  async getTeacherScheduleStats(teacherId: string): Promise<{
    totalSlots: number;
    occupiedSlots: number;
    availableSlots: number;
    totalHours: number;
    weeklyHours: number;
  }> {
    try {
      const response = await httpService.get<any>(
        `schedule/teacher/${teacherId}/stats`
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get teacher schedule stats:', error);
      throw new Error('שגיאה בטעינת סטטיסטיקות מערכת השעות');
    }
  },
};

// Legacy exports for backward compatibility
export type {
  ScheduleSlot,
  StudentSchedule,
  TeacherSchedule,
  WeeklySchedule,
  CreateScheduleSlotRequest as CreateScheduleSlotData,
  UpdateScheduleSlotRequest as UpdateScheduleSlotData,
  AssignStudentRequest as AssignStudentData,
  GetAvailableSlotsRequest as AvailableSlotsFilter,
  // Time Block System exports
  TimeBlock,
  LessonAssignment,
  AvailableSlot,
  CreateTimeBlockRequest,
  AssignLessonRequest,
  SlotSearchCriteria,
  TeacherScheduleStats,
  LessonDurationMinutes,
} from '../types/schedule';

// Export schedule service first (already exported above)

// ========================================
// TIME BLOCK SYSTEM SERVICES
// ========================================

export const timeBlockService = {
  /**
   * Create a new time block for a teacher
   * Uses the existing slot creation endpoint until backend is updated
   * @param teacherId - The ID of the teacher
   * @param timeBlockData - The data for the new time block
   * @returns The created time block
   */
  async createTimeBlock(
    teacherId: string,
    timeBlockData: CreateTimeBlockRequest
  ): Promise<TimeBlock> {
    try {
      // Calculate duration in minutes from start and end time
      const [startHour, startMinute] = timeBlockData.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeBlockData.endTime.split(':').map(Number);
      const durationMinutes = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));

      // Format request to match backend Hebrew field names
      const backendRequest = {
        יום: timeBlockData.day,
        שעה: timeBlockData.startTime,
        'משך השיעור': durationMinutes,
        מיקום: timeBlockData.location || '',
        הערות: timeBlockData.notes || '',
      };

      const response = await httpService.post<any>(
        `schedule/teacher/${teacherId}/slot`,
        backendRequest
      );
      
      // Transform backend response to TimeBlock format for consistency
      const timeBlock: TimeBlock = {
        _id: response._id || response.id || `temp-${Date.now()}`,
        teacherId,
        day: timeBlockData.day,
        startTime: timeBlockData.startTime,
        endTime: timeBlockData.endTime,
        location: timeBlockData.location,
        notes: timeBlockData.notes,
        isActive: true,
        assignedLessons: [],
        availableMinutes: durationMinutes,
        utilizationPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return timeBlock;
    } catch (error) {
      console.error('Failed to create time block:', error);
      throw new Error('שגיאה ביצירת יום לימוד חדש');
    }
  },

  // Helper method to calculate available minutes
  calculateAvailableMinutes(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return endMinutes - startMinutes;
  },

  /**
   * Update an existing time block
   * @param timeBlockId - The ID of the time block to update
   * @param updateData - The data to update
   * @returns The updated time block and affected assignments
   */
  async updateTimeBlock(
    timeBlockId: string,
    updateData: UpdateTimeBlockRequest
  ): Promise<TimeBlock> {
    try {
      const response = await httpService.put<TimeBlock>(
        `schedule/time-block/${timeBlockId}`,
        updateData
      );
      
      return response;
    } catch (error) {
      console.error('Failed to update time block:', error);
      throw new Error('שגיאה בעדכון יום הלימוד');
    }
  },

  /**
   * Delete a time block and handle cascading effects
   * @param timeBlockId - The ID of the time block to delete
   * @returns Success status and affected assignments
   */
  async deleteTimeBlock(timeBlockId: string): Promise<{
    success: boolean;
    affectedAssignments: LessonAssignment[];
    message?: string;
  }> {
    try {
      const response = await httpService.delete<{
        success: boolean;
        affectedAssignments: LessonAssignment[];
        message?: string;
      }>(`schedule/time-block/${timeBlockId}`);
      
      return response;
    } catch (error) {
      console.error('Failed to delete time block:', error);
      throw new Error('שגיאה במחיקת יום הלימוד');
    }
  },

  /**
   * Get all time blocks for a teacher
   * @param teacherId - The ID of the teacher
   * @param includeStats - Whether to include utilization statistics
   * @returns Array of time blocks with optional stats
   */
  async getTeacherTimeBlocks(
    teacherId: string,
    includeStats: boolean = true
  ): Promise<{
    timeBlocks: TimeBlock[];
    stats?: TeacherScheduleStats;
  }> {
    try {
      const response = await httpService.get<{
        timeBlocks: TimeBlock[];
        stats?: TeacherScheduleStats;
      }>(
        `schedule/teacher/${teacherId}/time-blocks`,
        { includeStats }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get teacher time blocks:', error);
      throw new Error('שגיאה בטעינת ימי הלימוד של המורה');
    }
  },

  /**
   * Get enhanced available slots based on duration and preferences
   * @param criteria - Search criteria for finding available slots
   * @returns Array of available slots with optimization scores
   */
  async getAvailableSlotsEnhanced(
    criteria: SlotSearchCriteria
  ): Promise<{ success: boolean; slots: AvailableSlot[]; message?: string }> {
    try {
      const response = await httpService.get<{ success: boolean; slots: AvailableSlot[]; message?: string }>(
        `schedule/teacher/${criteria.teacherId}/available-slots-enhanced`,
        criteria
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get enhanced available slots:', error);
      throw new Error('שגיאה בטעינת השעות הזמינות המשופרות');
    }
  },

  /**
   * Get teacher's time blocks for slot calculation
   */

  /**
   * Calculate available slots dynamically from time blocks (client-side)
   * This provides immediate feedback without waiting for backend
   */
  async calculateDynamicSlots(
    teacherId: string,
    duration: LessonDurationMinutes,
    excludeStudentId?: string
  ): Promise<AvailableSlot[]> {
    try {
      // Get teacher's time blocks
      const timeBlocksResponse = await this.getTeacherTimeBlocks(teacherId);
      const timeBlocks = timeBlocksResponse.timeBlocks;
      const availableSlots: AvailableSlot[] = [];

      for (const timeBlock of timeBlocks) {
        // Calculate all possible slots within this time block
        const blockSlots = this.calculateSlotsFromTimeBlock(timeBlock, duration);
        availableSlots.push(...blockSlots);
      }

      // Sort by optimal score (prefer earlier times with better gaps)
      return availableSlots.sort((a, b) => b.optimalScore - a.optimalScore);
    } catch (error) {
      console.error('Failed to calculate dynamic slots:', error);
      return [];
    }
  },

  /**
   * Calculate possible lesson slots within a single time block
   */
  calculateSlotsFromTimeBlock(
    timeBlock: TimeBlock,
    requestedDuration: LessonDurationMinutes
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const startMinutes = timeToMinutes(timeBlock.startTime);
    const endMinutes = timeToMinutes(timeBlock.endTime);
    const blockDuration = endMinutes - startMinutes;

    // Can't fit the requested duration
    if (blockDuration < requestedDuration) {
      return slots;
    }

    // Get existing assignments (sorted by start time)
    const existingLessons = [...(timeBlock.assignedLessons || [])]
      .sort((a, b) => timeToMinutes(a.lessonStartTime) - timeToMinutes(b.lessonStartTime));

    // Find gaps between existing lessons
    let currentPosition = startMinutes;

    for (const lesson of existingLessons) {
      const lessonStart = timeToMinutes(lesson.lessonStartTime);
      const lessonEnd = timeToMinutes(lesson.lessonEndTime);
      
      // Check if there's a gap before this lesson
      const gapBefore = lessonStart - currentPosition;
      if (gapBefore >= requestedDuration) {
        // Add all possible slots in this gap
        const gapSlots = this.generateSlotsInRange(
          currentPosition,
          lessonStart,
          requestedDuration,
          timeBlock
        );
        slots.push(...gapSlots);
      }
      
      currentPosition = lessonEnd;
    }

    // Check for gap after the last lesson
    const finalGap = endMinutes - currentPosition;
    if (finalGap >= requestedDuration) {
      const finalSlots = this.generateSlotsInRange(
        currentPosition,
        endMinutes,
        requestedDuration,
        timeBlock
      );
      slots.push(...finalSlots);
    }

    return slots;
  },

  /**
   * Generate available slots within a time range
   */
  generateSlotsInRange(
    startMinutes: number,
    endMinutes: number,
    duration: LessonDurationMinutes,
    timeBlock: TimeBlock
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const rangeSpan = endMinutes - startMinutes;
    const slotIncrement = 15; // 15-minute increments

    // Generate slots every 15 minutes
    for (let current = startMinutes; current + duration <= endMinutes; current += slotIncrement) {
      const possibleStartTime = minutesToTime(current);
      const possibleEndTime = minutesToTime(current + duration);
      
      // Calculate gaps for optimal scoring
      const gapBefore = current - startMinutes;
      const gapAfter = endMinutes - (current + duration);
      
      // Calculate optimal score (prefer slots with reasonable gaps)
      let optimalScore = 50; // Base score
      
      // Prefer slots with small gaps (15-30 minutes)
      if (gapBefore >= 15 && gapBefore <= 30) optimalScore += 20;
      if (gapAfter >= 15 && gapAfter <= 30) optimalScore += 20;
      
      // Prefer slots not at the very beginning or end
      if (gapBefore > 0 && gapAfter > 0) optimalScore += 10;
      
      // Prefer longer durations (better utilization)
      if (duration >= 60) optimalScore += 10;
      
      // Random small variation to break ties
      optimalScore += Math.random() * 5;

      const slot: AvailableSlot = {
        timeBlockId: timeBlock._id,
        possibleStartTime,
        possibleEndTime,
        duration,
        teacherId: timeBlock.teacherId,
        day: timeBlock.day,
        location: timeBlock.location,
        optimalScore: Math.min(100, Math.round(optimalScore)),
        gapMinutesBefore: gapBefore,
        gapMinutesAfter: gapAfter
      };

      slots.push(slot);
    }

    return slots;
  },

  /**
   * Assign a lesson and return updated available slots
   */
  async assignLessonAndRefreshSlots(
    assignmentData: {
      timeBlockId: string;
      studentId: string;
      studentName: string;
      lessonStartTime: string;
      duration: LessonDurationMinutes;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    assignment: LessonAssignment;
    updatedSlots: AvailableSlot[];
    message?: string;
  }> {
    try {
      // First, assign the lesson
      const lessonEndTime = minutesToTime(
        timeToMinutes(assignmentData.lessonStartTime) + assignmentData.duration
      );

      const lessonAssignment: AssignLessonRequest = {
        timeBlockId: assignmentData.timeBlockId,
        studentId: assignmentData.studentId,
        lessonStartTime: assignmentData.lessonStartTime,
        duration: assignmentData.duration,
        notes: assignmentData.notes
      };

      const assignResult = await this.assignLessonToSlot(lessonAssignment);
      
      if (!assignResult.success) {
        throw new Error('Failed to assign lesson');
      }

      // Get the updated time block to calculate new available slots
      const updatedTimeBlock = assignResult.updatedTimeBlock;
      const newSlots = this.calculateSlotsFromTimeBlock(updatedTimeBlock, assignmentData.duration);

      return {
        success: true,
        assignment: assignResult.assignment,
        updatedSlots: newSlots,
        message: 'השיעור נוסף בהצלחה והשעות הזמינות עודכנו'
      };
    } catch (error) {
      console.error('Failed to assign lesson and refresh slots:', error);
      throw new Error('שגיאה בהקצאת השיעור');
    }
  },

  /**
   * Intelligently assign a lesson to an optimal slot
   * @param assignmentData - The lesson assignment data
   * @returns The assignment result with updated time block
   */
  async assignLessonToSlot(
    assignmentData: AssignLessonRequest
  ): Promise<{ success: boolean; assignment: LessonAssignment; updatedTimeBlock: TimeBlock; message?: string }> {
    try {
      const response = await httpService.post<{ success: boolean; assignment: LessonAssignment; updatedTimeBlock: TimeBlock; message?: string }>(
        'schedule/assign-lesson',
        assignmentData
      );
      
      return response;
    } catch (error) {
      console.error('Failed to assign lesson to slot:', error);
      throw new Error('שגיאה בשיוך השיעור ליום הלימוד');
    }
  },

  /**
   * Reschedule an existing lesson to a new time block
   * @param rescheduleData - The rescheduling data
   * @returns The rescheduling result with affected time blocks
   */
  async rescheduleLesson(
    rescheduleData: RescheduleLessonRequest
  ): Promise<{ success: boolean; oldAssignment: LessonAssignment; newAssignment: LessonAssignment; affectedTimeBlocks: TimeBlock[]; message?: string }> {
    try {
      const response = await httpService.put<{ success: boolean; oldAssignment: LessonAssignment; newAssignment: LessonAssignment; affectedTimeBlocks: TimeBlock[]; message?: string }>(
        'schedule/reschedule-lesson',
        rescheduleData
      );
      
      return response;
    } catch (error) {
      console.error('Failed to reschedule lesson:', error);
      throw new Error('שגיאה בשינוי מועד השיעור');
    }
  },

  /**
   * Cancel a lesson assignment and free up the time slot
   * @param assignmentId - The ID of the lesson assignment to cancel
   * @returns The updated time block after cancellation
   */
  async cancelLessonAssignment(assignmentId: string): Promise<{
    success: boolean;
    updatedTimeBlock: TimeBlock;
    cancelledAssignment: LessonAssignment;
    message?: string;
  }> {
    try {
      const response = await httpService.delete<{
        success: boolean;
        updatedTimeBlock: TimeBlock;
        cancelledAssignment: LessonAssignment;
        message?: string;
      }>(`schedule/lesson-assignment/${assignmentId}`);
      
      return response;
    } catch (error) {
      console.error('Failed to cancel lesson assignment:', error);
      throw new Error('שגיאה בביטול שיוך השיעור');
    }
  },

  /**
   * Find optimal lesson slots based on student preferences
   * @param teacherId - The ID of the teacher
   * @param studentPreferences - Student's scheduling preferences
   * @returns Ranked list of optimal available slots
   */
  async findOptimalSlots(
    teacherId: string,
    studentPreferences: StudentSlotPreferences
  ): Promise<{
    optimalSlots: AvailableSlot[];
    alternativeSlots: AvailableSlot[];
    recommendationReasons: string[];
  }> {
    try {
      const response = await httpService.post<{
        optimalSlots: AvailableSlot[];
        alternativeSlots: AvailableSlot[];
        recommendationReasons: string[];
      }>(
        `schedule/teacher/${teacherId}/find-optimal-slots`,
        studentPreferences
      );
      
      return response;
    } catch (error) {
      console.error('Failed to find optimal slots:', error);
      throw new Error('שגיאה במציאת השעות האופטימליות');
    }
  },

  /**
   * Get teacher schedule statistics and utilization analytics
   * @param teacherId - The ID of the teacher
   * @param period - Optional time period for analytics
   * @returns Comprehensive schedule statistics
   */
  async getTeacherScheduleStats(
    teacherId: string,
    period?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<TeacherScheduleStats> {
    try {
      const params = period ? { ...period } : {};
      const response = await httpService.get<TeacherScheduleStats>(
        `schedule/teacher/${teacherId}/stats-enhanced`,
        params
      );
      
      return response;
    } catch (error) {
      console.error('Failed to get teacher schedule stats:', error);
      throw new Error('שגיאה בטעינת סטטיסטיקות מערכת השעות');
    }
  },

  /**
   * Batch create multiple time blocks (e.g., recurring blocks)
   * @param teacherId - The ID of the teacher
   * @param timeBlocks - Array of time block data
   * @returns Results of batch creation
   */
  async batchCreateTimeBlocks(
    teacherId: string,
    timeBlocks: CreateTimeBlockRequest[]
  ): Promise<{
    successful: TimeBlock[];
    failed: { data: CreateTimeBlockRequest; error: string }[];
    summary: {
      totalCreated: number;
      totalFailed: number;
    };
  }> {
    try {
      const response = await httpService.post<{
        successful: TimeBlock[];
        failed: { data: CreateTimeBlockRequest; error: string }[];
        summary: {
          totalCreated: number;
          totalFailed: number;
        };
      }>(
        `schedule/teacher/${teacherId}/time-blocks/batch`,
        { timeBlocks }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to batch create time blocks:', error);
      throw new Error('שגיאה ביצירה מרובה של ימי לימוד');
    }
  },

  /**
   * Get schedule optimization suggestions
   * @param teacherId - The ID of the teacher
   * @returns AI-powered optimization suggestions
   */
  async getOptimizationSuggestions(teacherId: string): Promise<{
    suggestions: {
      type: string;
      description: string;
      impact: string;
      difficulty: 'easy' | 'medium' | 'hard';
      action: string;
    }[];
    currentScore: number;
    potentialScore: number;
  }> {
    try {
      const response = await httpService.get<{
        suggestions: {
          type: string;
          description: string;
          impact: string;
          difficulty: 'easy' | 'medium' | 'hard';
          action: string;
        }[];
        currentScore: number;
        potentialScore: number;
      }>(`schedule/teacher/${teacherId}/optimization-suggestions`);
      
      return response;
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error);
      throw new Error('שגיאה בטעינת הצעות אופטימיזציה');
    }
  },

  /**
   * Validate time block before creation/update
   * @param timeBlockData - The time block data to validate
   * @param existingBlocks - Existing time blocks for conflict checking
   * @returns Validation result
   */
  async validateTimeBlock(
    timeBlockData: Partial<TimeBlock>,
    existingBlocks?: TimeBlock[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    conflicts: {
      conflictingBlock: TimeBlock;
      message: string;
    }[];
  }> {
    try {
      const response = await httpService.post<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
        conflicts: {
          conflictingBlock: TimeBlock;
          message: string;
        }[];
      }>(
        'schedule/validate-time-block',
        { timeBlockData, existingBlocks }
      );
      
      return response;
    } catch (error) {
      console.error('Failed to validate time block:', error);
      throw new Error('שגיאה בבדיקת תקינות יום הלימוד');
    }
  },
};

// Export timeBlockService after it's defined (already exported above)

// Enhanced schedule service that combines legacy and time block functionality
export const enhancedScheduleService = {
  ...scheduleService, // Legacy slot-based methods
  ...timeBlockService, // New time block methods
  
  /**
   * Universal method to get available teaching times
   * Supports both legacy slots and new time blocks
   * @param teacherId - The ID of the teacher
   * @param criteria - Search criteria
   * @param useTimeBlocks - Whether to use new time block system
   * @returns Available slots from either system
   */
  async getAvailableTeachingTimes(
    teacherId: string,
    criteria: {
      duration?: LessonDurationMinutes;
      preferredDays?: HebrewDayName[];
      preferredTimeRange?: {
        startTime: string;
        endTime: string;
      };
    },
    useTimeBlocks: boolean = true
  ): Promise<AvailableSlot[]> {
    if (useTimeBlocks) {
      const searchCriteria: SlotSearchCriteria = {
        teacherId,
        duration: criteria.duration || 60,
        preferredDays: criteria.preferredDays,
        preferredTimeRange: criteria.preferredTimeRange,
        sortBy: 'optimal',
      };
      
      const response = await timeBlockService.getAvailableSlotsEnhanced(searchCriteria);
      return response.slots;
    } else {
      // Legacy method for backward compatibility
      const legacySlots = await scheduleService.getAvailableSlots(teacherId, {
        duration: criteria.duration,
      });
      
      // Transform legacy slots to new format
      return legacySlots.map((slot): AvailableSlot => ({
        timeBlockId: slot.id, // Use slot ID as time block ID for legacy
        possibleStartTime: slot.startTime,
        possibleEndTime: slot.endTime,
        duration: (criteria.duration || 60) as LessonDurationMinutes,
        teacherId: slot.teacherId,
        teacherName: slot.teacherName,
        day: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][slot.dayOfWeek] as HebrewDayName,
        location: slot.location,
        optimalScore: 50, // Default score for legacy slots
      }));
    }
  },
};

export default enhancedScheduleService;