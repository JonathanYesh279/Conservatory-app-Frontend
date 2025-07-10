// src/services/timeBlockService.ts
import { httpService } from './httpService';

// Hebrew day names as required by backend
export const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;
export type HebrewDayName = typeof HEBREW_DAYS[number];

// Lesson durations supported by the backend
export const LESSON_DURATIONS = [30, 45, 60] as const;
export type LessonDurationMinutes = typeof LESSON_DURATIONS[number];

// Types for the new Time Block System
export interface TimeBlockRequest {
  day: HebrewDayName;
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  location?: string;
  notes?: string;
}

export interface TimeBlockResponse {
  _id: string;
  teacherId: string;
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  totalDuration: number; // in minutes
  location?: string;
  notes?: string;
  assignedLessons: LessonAssignment[];
  availableMinutes: number;
  utilizationPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonAssignment {
  _id: string;
  studentId: string;
  studentName: string;
  lessonStartTime: string; // HH:MM format
  lessonEndTime: string; // HH:MM format
  duration: LessonDurationMinutes;
  notes?: string;
  createdAt: string;
}

export interface AvailableSlot {
  timeBlockId: string;
  teacherId: string;
  teacherName?: string;
  possibleStartTime: string; // HH:MM format
  possibleEndTime: string; // HH:MM format
  duration: LessonDurationMinutes;
  day: HebrewDayName;
  location?: string;
  optimalScore: number; // AI-calculated optimization score (0-100)
  gapMinutesBefore?: number;
  gapMinutesAfter?: number;
}

export interface SlotSearchCriteria {
  duration: LessonDurationMinutes;
  preferredDays?: HebrewDayName[];
  preferredTimeRange?: {
    startTime: string;
    endTime: string;
  };
  studentPreferences?: {
    morningPreference?: boolean;
    afternoonPreference?: boolean;
    avoidBackToBack?: boolean;
  };
}

export interface AssignLessonRequest {
  timeBlockId: string;
  studentId: string;
  studentName: string;
  lessonStartTime: string; // HH:MM format
  duration: LessonDurationMinutes;
  notes?: string;
}

export interface TeacherScheduleWithBlocks {
  teacherId: string;
  teacherName: string;
  timeBlocks: TimeBlockResponse[];
  weeklyStats: {
    totalTimeBlocks: number;
    totalAvailableMinutes: number;
    totalAssignedMinutes: number;
    utilizationPercentage: number;
    averageBlockSize: number;
  };
}

/**
 * Enhanced Time Block Service for flexible teacher schedule management
 * Supports 45-minute lessons and automatic slot calculation
 */
export const timeBlockService = {
  /**
   * Create a new time block for a teacher
   * POST /api/schedule/time-blocks/teacher/{teacherId}/time-block
   */
  async createTimeBlock(
    teacherId: string,
    timeBlockData: TimeBlockRequest
  ): Promise<TimeBlockResponse> {
    try {
      const response = await httpService.post<TimeBlockResponse>(
        `schedule/time-blocks/teacher/${teacherId}/time-block`,
        timeBlockData
      );
      return response;
    } catch (error) {
      console.error('Failed to create time block:', error);
      
      // Enhanced error handling for specific conflict scenarios
      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('409')) {
          throw new Error(`יום הלימוד מתנגש עם לוח זמנים קיים ביום ${timeBlockData.day} בזמן ${timeBlockData.startTime}-${timeBlockData.endTime}. אנא בדוק את הלוח הקיים ובחר זמן אחר.`);
        }
        throw error;
      }
      
      throw new Error('שגיאה ביצירת יום לימוד חדש');
    }
  },

  /**
   * Get available lesson slots for a teacher with flexible duration support
   * GET /api/schedule/time-blocks/teacher/{teacherId}/available-slots
   */
  async getAvailableSlots(
    teacherId: string,
    criteria: SlotSearchCriteria
  ): Promise<{
    availableSlots: AvailableSlot[];
    totalSlots: number;
    recommendedSlots: AvailableSlot[]; // Top 5 AI-recommended slots
  }> {
    try {
      // Import axios directly to bypass any httpService contamination
      const axios = (await import('axios')).default;
      
      // Build URL with query parameters manually to ensure no contamination
      const params = new URLSearchParams();
      
      // Only add explicitly allowed parameters
      params.append('duration', criteria.duration.toString());
      
      if (criteria.preferredDays?.length) {
        params.append('preferredDays', criteria.preferredDays.join(','));
      }
      
      if (criteria.preferredTimeRange?.startTime) {
        params.append('preferredStartTime', criteria.preferredTimeRange.startTime);
      }
      
      if (criteria.preferredTimeRange?.endTime) {
        params.append('preferredEndTime', criteria.preferredTimeRange.endTime);
      }
      
      // Add student preferences, but only the expected boolean fields
      if (criteria.studentPreferences) {
        if (criteria.studentPreferences.morningPreference !== undefined) {
          params.append('morningPreference', criteria.studentPreferences.morningPreference.toString());
        }
        if (criteria.studentPreferences.afternoonPreference !== undefined) {
          params.append('afternoonPreference', criteria.studentPreferences.afternoonPreference.toString());
        }
        if (criteria.studentPreferences.avoidBackToBack !== undefined) {
          params.append('avoidBackToBack', criteria.studentPreferences.avoidBackToBack.toString());
        }
      }

      const queryString = params.toString();
      
      // Determine base URL
      const baseURL = process.env.NODE_ENV === 'production' ? '/api/' : 'http://localhost:3001/api/';
      const fullUrl = `${baseURL}schedule/time-blocks/teacher/${teacherId}/available-slots${queryString ? `?${queryString}` : ''}`;

      // Get auth token
      const token = localStorage.getItem('accessToken');

      // Debug: Log what we're sending
      console.log('Original criteria:', criteria);
      console.log('Built full URL:', fullUrl);
      console.log('Query params:', queryString);

      // Make direct axios request to bypass any middleware contamination
      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        withCredentials: true
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get available slots:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('schoolYearId')) {
        throw new Error('שגיאת אימות פרמטרים - נסה שוב או פנה למנהל המערכת');
      }
      
      throw new Error('שגיאה בטעינת השעות הזמינות');
    }
  },

  /**
   * Get teacher's time blocks
   */
  async getTeacherTimeBlocks(teacherId: string): Promise<TimeBlockResponse[]> {
    try {
      const response = await httpService.get<{ timeBlocks: TimeBlockResponse[] }>(
        `teacher/${teacherId}/time-blocks`
      );
      return response.timeBlocks || [];
    } catch (error) {
      console.error('Failed to get teacher time blocks:', error);
      return [];
    }
  },

  /**
   * Assign a lesson to a specific time slot
   * POST /api/schedule/time-blocks/assign-lesson
   */
  async assignLesson(assignmentData: AssignLessonRequest): Promise<{
    success: boolean;
    assignment: LessonAssignment;
    updatedTimeBlock: TimeBlockResponse;
    newAvailableSlots: AvailableSlot[]; // Recalculated slots for this duration
    message: string;
  }> {
    try {
      const response = await httpService.post<{
        success: boolean;
        assignment: LessonAssignment;
        updatedTimeBlock: TimeBlockResponse;
        newAvailableSlots: AvailableSlot[];
        message: string;
      }>('schedule/time-blocks/assign-lesson', assignmentData);

      return response;
    } catch (error) {
      console.error('Failed to assign lesson:', error);
      throw new Error('שגיאה בהקצאת השיעור');
    }
  },

  /**
   * Get complete teacher schedule with time blocks
   * Uses existing teacher endpoint and extracts time blocks
   */
  async getTeacherScheduleWithBlocks(teacherId: string): Promise<TeacherScheduleWithBlocks> {
    try {
      // Use existing teacher service to get teacher data with time blocks
      const { teacherService } = await import('./teacherService');
      const teacherData = await teacherService.getTeacherById(teacherId);
      
      if (!teacherData) {
        throw new Error('Teacher not found');
      }
      
      // Extract time blocks from teacher data - they are in teaching.timeBlocks according to the MongoDB structure
      const timeBlocks = (teacherData as any)?.teaching?.timeBlocks || [];
      
      // Transform to expected format
      const teacherSchedule: TeacherScheduleWithBlocks = {
        teacherId,
        teacherName: teacherData.personalInfo?.fullName || 'Unknown Teacher',
        timeBlocks: timeBlocks.map((block: any) => ({
          _id: block._id || block.id,
          teacherId,
          day: block.day,
          startTime: block.startTime,
          endTime: block.endTime,
          totalDuration: block.totalDuration || this.calculateTotalDuration(block.startTime, block.endTime),
          location: block.location || '',
          notes: block.notes || '',
          assignedLessons: block.assignedLessons || [],
          availableMinutes: block.availableMinutes || this.calculateTotalDuration(block.startTime, block.endTime),
          utilizationPercentage: block.utilizationPercentage || 0,
          isActive: block.isActive !== false, // default to true if not specified
          createdAt: block.createdAt || new Date().toISOString(),
          updatedAt: block.updatedAt || new Date().toISOString()
        })),
        weeklyStats: {
          totalTimeBlocks: timeBlocks.length,
          totalAvailableMinutes: timeBlocks.reduce((sum: number, block: any) => 
            sum + (block.availableMinutes || this.calculateTotalDuration(block.startTime, block.endTime)), 0),
          totalAssignedMinutes: timeBlocks.reduce((sum: number, block: any) => 
            sum + (block.assignedLessons?.reduce((lessonSum: number, lesson: any) => lessonSum + lesson.duration, 0) || 0), 0),
          utilizationPercentage: 0, // Will be calculated below
          averageBlockSize: 0 // Will be calculated below
        }
      };
      
      // Calculate utilization percentage
      if (teacherSchedule.weeklyStats.totalAvailableMinutes > 0) {
        teacherSchedule.weeklyStats.utilizationPercentage = Math.round(
          (teacherSchedule.weeklyStats.totalAssignedMinutes / teacherSchedule.weeklyStats.totalAvailableMinutes) * 100
        );
      }
      
      // Calculate average block size
      if (teacherSchedule.timeBlocks.length > 0) {
        teacherSchedule.weeklyStats.averageBlockSize = Math.round(
          teacherSchedule.weeklyStats.totalAvailableMinutes / teacherSchedule.timeBlocks.length
        );
      }
      
      return teacherSchedule;
    } catch (error) {
      console.error('Failed to get teacher schedule with blocks:', error);
      throw new Error('שגיאה בטעינת מערכת השעות עם ימי לימוד');
    }
  },

  /**
   * Helper function to calculate total duration in minutes
   */
  calculateTotalDuration(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    return endMinutes - startMinutes;
  },

  /**
   * Update an existing time block
   */
  async updateTimeBlock(
    timeBlockId: string,
    updateData: Partial<TimeBlockRequest>
  ): Promise<{
    success: boolean;
    updatedTimeBlock: TimeBlockResponse;
    affectedAssignments: LessonAssignment[];
    message: string;
  }> {
    try {
      const response = await httpService.put<{
        success: boolean;
        updatedTimeBlock: TimeBlockResponse;
        affectedAssignments: LessonAssignment[];
        message: string;
      }>(`schedule/time-blocks/${timeBlockId}`, updateData);

      return response;
    } catch (error) {
      console.error('Failed to update time block:', error);
      throw new Error('שגיאה בעדכון יום הלימוד');
    }
  },

  /**
   * Delete a time block and handle cascading lesson cancellations
   */
  async deleteTimeBlock(timeBlockId: string): Promise<{
    success: boolean;
    affectedAssignments: LessonAssignment[];
    message: string;
  }> {
    try {
      const response = await httpService.delete<{
        success: boolean;
        affectedAssignments: LessonAssignment[];
        message: string;
      }>(`schedule/time-blocks/${timeBlockId}`);

      return response;
    } catch (error) {
      console.error('Failed to delete time block:', error);
      throw new Error('שגיאה במחיקת יום הלימוד');
    }
  },

  /**
   * Cancel a specific lesson assignment
   */
  async cancelLessonAssignment(assignmentId: string): Promise<{
    success: boolean;
    updatedTimeBlock: TimeBlockResponse;
    cancelledAssignment: LessonAssignment;
    newAvailableSlots: AvailableSlot[];
    message: string;
  }> {
    try {
      const response = await httpService.delete<{
        success: boolean;
        updatedTimeBlock: TimeBlockResponse;
        cancelledAssignment: LessonAssignment;
        newAvailableSlots: AvailableSlot[];
        message: string;
      }>(`schedule/time-blocks/lesson-assignment/${assignmentId}`);

      return response;
    } catch (error) {
      console.error('Failed to cancel lesson assignment:', error);
      throw new Error('שגיאה בביטול השיעור');
    }
  },

  /**
   * Get real-time availability for quick checks (client-side calculation)
   */
  calculateDynamicAvailability(
    timeBlocks: TimeBlockResponse[],
    requestedDuration: LessonDurationMinutes
  ): AvailableSlot[] {
    const availableSlots: AvailableSlot[] = [];

    for (const timeBlock of timeBlocks) {
      if (!timeBlock.isActive || timeBlock.availableMinutes < requestedDuration) {
        continue;
      }

      // Parse time block bounds
      const blockStart = this.timeToMinutes(timeBlock.startTime);
      const blockEnd = this.timeToMinutes(timeBlock.endTime);

      // Get sorted existing lessons
      const existingLessons = [...timeBlock.assignedLessons]
        .sort((a, b) => this.timeToMinutes(a.lessonStartTime) - this.timeToMinutes(b.lessonStartTime));

      // Find gaps between lessons
      let currentPosition = blockStart;

      for (const lesson of existingLessons) {
        const lessonStart = this.timeToMinutes(lesson.lessonStartTime);
        const lessonEnd = this.timeToMinutes(lesson.lessonEndTime);

        // Check gap before this lesson
        const gapBefore = lessonStart - currentPosition;
        if (gapBefore >= requestedDuration) {
          const slotsInGap = this.generateSlotsInRange(
            currentPosition,
            lessonStart,
            requestedDuration,
            timeBlock
          );
          availableSlots.push(...slotsInGap);
        }

        currentPosition = lessonEnd;
      }

      // Check gap after last lesson
      const finalGap = blockEnd - currentPosition;
      if (finalGap >= requestedDuration) {
        const finalSlots = this.generateSlotsInRange(
          currentPosition,
          blockEnd,
          requestedDuration,
          timeBlock
        );
        availableSlots.push(...finalSlots);
      }
    }

    // Sort by optimal score (AI-calculated or heuristic)
    return availableSlots.sort((a, b) => b.optimalScore - a.optimalScore);
  },

  /**
   * Generate available slots within a time range
   */
  generateSlotsInRange(
    startMinutes: number,
    endMinutes: number,
    duration: LessonDurationMinutes,
    timeBlock: TimeBlockResponse
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const slotIncrement = 15; // 15-minute increments for flexibility

    for (let current = startMinutes; current + duration <= endMinutes; current += slotIncrement) {
      const possibleStartTime = this.minutesToTime(current);
      const possibleEndTime = this.minutesToTime(current + duration);

      // Calculate gaps for scoring
      const gapBefore = current - startMinutes;
      const gapAfter = endMinutes - (current + duration);

      // Simple heuristic scoring (backend will provide AI-optimized scores)
      let optimalScore = 50;

      // Prefer slots with reasonable gaps (15-30 minutes)
      if (gapBefore >= 15 && gapBefore <= 30) optimalScore += 15;
      if (gapAfter >= 15 && gapAfter <= 30) optimalScore += 15;

      // Prefer not at edges
      if (gapBefore > 0 && gapAfter > 0) optimalScore += 10;

      // Prefer longer lessons for efficiency
      if (duration >= 60) optimalScore += 5;

      // Prefer morning slots (before 14:00)
      const slotHour = Math.floor(current / 60);
      if (slotHour < 14) optimalScore += 5;

      const slot: AvailableSlot = {
        timeBlockId: timeBlock._id,
        teacherId: timeBlock.teacherId,
        possibleStartTime,
        possibleEndTime,
        duration,
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
   * Utility: Convert time string to minutes
   */
  timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Utility: Convert minutes to time string
   */
  minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  /**
   * Validate lesson duration
   */
  isValidDuration(duration: number): duration is LessonDurationMinutes {
    return LESSON_DURATIONS.includes(duration as LessonDurationMinutes);
  },

  /**
   * Validate Hebrew day name
   */
  isValidDay(day: string): day is HebrewDayName {
    return HEBREW_DAYS.includes(day as HebrewDayName);
  },

  /**
   * Convert numeric day to Hebrew day name
   */
  numericToHebrewDay(dayNumber: number): HebrewDayName | null {
    if (dayNumber >= 0 && dayNumber < HEBREW_DAYS.length) {
      return HEBREW_DAYS[dayNumber];
    }
    return null;
  },

  /**
   * Convert Hebrew day name to numeric
   */
  hebrewToNumericDay(hebrewDay: HebrewDayName): number {
    return HEBREW_DAYS.indexOf(hebrewDay);
  },

  /**
   * Check for potential conflicts before creating a time block
   */
  validateTimeBlockConflicts(
    newTimeBlock: TimeBlockRequest,
    existingTimeBlocks: TimeBlockResponse[]
  ): { hasConflict: boolean; conflictingBlocks: TimeBlockResponse[]; conflictType: string } {
    const conflictingBlocks: TimeBlockResponse[] = [];
    let conflictType = '';

    const newStart = this.timeToMinutes(newTimeBlock.startTime);
    const newEnd = this.timeToMinutes(newTimeBlock.endTime);

    // Check for conflicts on the same day
    const sameDayBlocks = existingTimeBlocks.filter(
      block => block.day === newTimeBlock.day && block.isActive
    );

    for (const existingBlock of sameDayBlocks) {
      const existingStart = this.timeToMinutes(existingBlock.startTime);
      const existingEnd = this.timeToMinutes(existingBlock.endTime);

      // Check for time overlap
      const hasOverlap = (newStart < existingEnd && newEnd > existingStart);
      
      if (hasOverlap) {
        conflictingBlocks.push(existingBlock);
        
        if (newStart === existingStart && newEnd === existingEnd) {
          conflictType = 'exact_duplicate';
        } else if (newStart >= existingStart && newEnd <= existingEnd) {
          conflictType = 'contained_within';
        } else if (newStart <= existingStart && newEnd >= existingEnd) {
          conflictType = 'contains_existing';
        } else {
          conflictType = 'partial_overlap';
        }
      }
    }

    return {
      hasConflict: conflictingBlocks.length > 0,
      conflictingBlocks,
      conflictType
    };
  },

  /**
   * Get human-readable conflict description
   */
  getConflictDescription(
    conflictType: string,
    conflictingBlocks: TimeBlockResponse[],
    newTimeBlock: TimeBlockRequest
  ): string {
    const conflictBlock = conflictingBlocks[0];
    
    switch (conflictType) {
      case 'exact_duplicate':
        return `קיים כבר יום לימוד זהה ביום ${newTimeBlock.day} בשעות ${newTimeBlock.startTime}-${newTimeBlock.endTime}`;
      
      case 'contained_within':
        return `הזמן המבוקש ${newTimeBlock.startTime}-${newTimeBlock.endTime} נמצא בתוך יום לימוד קיים: ${conflictBlock.startTime}-${conflictBlock.endTime}`;
      
      case 'contains_existing':
        return `הזמן המבוקש ${newTimeBlock.startTime}-${newTimeBlock.endTime} מכיל יום לימוד קיים: ${conflictBlock.startTime}-${conflictBlock.endTime}`;
      
      case 'partial_overlap':
        return `הזמן המבוקש ${newTimeBlock.startTime}-${newTimeBlock.endTime} חופף עם יום לימוד קיים: ${conflictBlock.startTime}-${conflictBlock.endTime}`;
      
      default:
        return `קיימת התנגשות עם יום לימוד קיים ביום ${newTimeBlock.day}`;
    }
  }
};

export default timeBlockService;