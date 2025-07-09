// src/utils/scheduleTransformations.ts
// Data transformation utilities for schedule management

import {
  ScheduleSlot,
  BackendScheduleSlot,
  BackendTeacherSchedule,
  TeacherSchedule,
  WeeklySchedule,
  StudentSchedule,
  HebrewDayName,
  HEBREW_TO_NUMERIC_DAYS,
  NUMERIC_TO_HEBREW_DAYS,
  TeacherAssignmentFormData,
  ScheduleSlotFormData,
  CreateScheduleSlotRequest,
  UpdateScheduleSlotRequest,
  HEBREW_DAYS,
} from '../types/schedule';

/**
 * Convert Hebrew day name to numeric day (0-6)
 */
export const hebrewDayToNumeric = (hebrewDay: HebrewDayName): number => {
  return HEBREW_TO_NUMERIC_DAYS[hebrewDay];
};

/**
 * Convert numeric day (0-6) to Hebrew day name
 */
export const numericDayToHebrew = (numericDay: number): HebrewDayName => {
  return NUMERIC_TO_HEBREW_DAYS[numericDay];
};

/**
 * Calculate duration from start and end time
 */
export const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
};

/**
 * Calculate end time from start time and duration
 */
export const calculateEndTimeFromDuration = (startTime: string, duration: number): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = startMinutes + duration;
  
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;
  
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

/**
 * Transform backend schedule slot to frontend format
 */
export const transformBackendSlotToFrontend = (backendSlot: BackendScheduleSlot): ScheduleSlot => {
  const dayOfWeek = hebrewDayToNumeric(backendSlot.day);
  const endTime = calculateEndTimeFromDuration(backendSlot.time, backendSlot.duration);
  
  return {
    id: backendSlot._id,
    teacherId: backendSlot.teacherId,
    teacherName: backendSlot.teacherName,
    studentId: backendSlot.studentId,
    studentName: backendSlot.studentName,
    dayOfWeek,
    startTime: backendSlot.time,
    endTime,
    duration: backendSlot.duration,
    location: backendSlot.location,
    notes: backendSlot.notes,
    isRecurring: true, // Assume recurring by default
    isActive: backendSlot.isActive,
    createdAt: backendSlot.createdAt,
    updatedAt: backendSlot.updatedAt,
  };
};

/**
 * Transform frontend schedule slot to backend format
 */
export const transformFrontendSlotToBackend = (frontendSlot: ScheduleSlot): BackendScheduleSlot => {
  const day = numericDayToHebrew(frontendSlot.dayOfWeek);
  const duration = frontendSlot.duration || calculateDurationFromTimes(frontendSlot.startTime, frontendSlot.endTime);
  
  return {
    _id: frontendSlot.id,
    teacherId: frontendSlot.teacherId,
    teacherName: frontendSlot.teacherName,
    studentId: frontendSlot.studentId,
    studentName: frontendSlot.studentName,
    day,
    time: frontendSlot.startTime,
    duration,
    location: frontendSlot.location,
    notes: frontendSlot.notes,
    isActive: frontendSlot.isActive,
    createdAt: frontendSlot.createdAt || new Date().toISOString(),
    updatedAt: frontendSlot.updatedAt || new Date().toISOString(),
  };
};

/**
 * Transform backend teacher schedule to frontend format
 */
export const transformBackendTeacherSchedule = (
  backendSchedule: BackendTeacherSchedule,
  teacherName?: string,
  instrument?: string
): TeacherSchedule => {
  const weeklySchedule: WeeklySchedule = {};
  
  // Initialize all days
  for (let i = 0; i < 7; i++) {
    weeklySchedule[i] = [];
  }
  
  // Transform slots by day
  Object.entries(backendSchedule.schedule).forEach(([hebrewDay, backendSlots]) => {
    if (backendSlots && backendSlots.length > 0) {
      const dayOfWeek = hebrewDayToNumeric(hebrewDay as HebrewDayName);
      weeklySchedule[dayOfWeek] = backendSlots.map(transformBackendSlotToFrontend);
    }
  });
  
  // Calculate statistics
  const allSlots = Object.values(weeklySchedule).flat();
  const occupiedSlots = allSlots.filter(slot => slot.studentId).length;
  
  return {
    teacherId: backendSchedule.teacherId,
    teacherName: teacherName || 'מורה לא ידוע',
    instrument,
    weeklySchedule,
    totalSlots: allSlots.length,
    occupiedSlots,
    availableSlots: allSlots.length - occupiedSlots,
  };
};

/**
 * Transform teacher assignment form data to schedule slot format
 */
export const transformTeacherAssignmentToSlot = (
  assignment: TeacherAssignmentFormData,
  teacherName?: string,
  studentId?: string,
  studentName?: string
): ScheduleSlot => {
  const dayOfWeek = hebrewDayToNumeric(assignment.day);
  const endTime = calculateEndTimeFromDuration(assignment.time, assignment.duration);
  
  return {
    id: assignment.scheduleSlotId || `temp-${Date.now()}`,
    teacherId: assignment.teacherId,
    teacherName,
    studentId,
    studentName,
    dayOfWeek,
    startTime: assignment.time,
    endTime,
    duration: assignment.duration,
    location: assignment.location,
    notes: assignment.notes,
    isRecurring: true,
    isActive: true,
  };
};

/**
 * Transform schedule slot to teacher assignment form data
 */
export const transformSlotToTeacherAssignment = (slot: ScheduleSlot): TeacherAssignmentFormData => {
  const day = numericDayToHebrew(slot.dayOfWeek);
  const duration = slot.duration || calculateDurationFromTimes(slot.startTime, slot.endTime);
  
  return {
    teacherId: slot.teacherId,
    scheduleSlotId: slot.id,
    day,
    time: slot.startTime,
    duration,
    location: slot.location,
    notes: slot.notes,
  };
};

/**
 * Transform form data to create schedule slot request
 */
export const transformFormDataToCreateRequest = (
  formData: ScheduleSlotFormData
): CreateScheduleSlotRequest => {
  const endTime = formData.endTime || calculateEndTimeFromDuration(formData.startTime, formData.duration);
  
  return {
    teacherId: formData.teacherId,
    dayOfWeek: formData.dayOfWeek,
    startTime: formData.startTime,
    endTime,
    location: formData.location,
    notes: formData.notes,
    isRecurring: formData.isRecurring,
  };
};

/**
 * Transform form data to update schedule slot request
 */
export const transformFormDataToUpdateRequest = (
  formData: Partial<ScheduleSlotFormData>
): UpdateScheduleSlotRequest => {
  const request: UpdateScheduleSlotRequest = {};
  
  if (formData.dayOfWeek !== undefined) request.dayOfWeek = formData.dayOfWeek;
  if (formData.startTime) request.startTime = formData.startTime;
  if (formData.startTime && formData.duration) {
    request.endTime = calculateEndTimeFromDuration(formData.startTime, formData.duration);
  } else if (formData.endTime) {
    request.endTime = formData.endTime;
  }
  if (formData.location !== undefined) request.location = formData.location;
  if (formData.notes !== undefined) request.notes = formData.notes;
  if (formData.isRecurring !== undefined) request.isRecurring = formData.isRecurring;
  
  return request;
};

/**
 * Group schedule slots by day for weekly view
 */
export const groupSlotsByDay = (slots: ScheduleSlot[]): WeeklySchedule => {
  const weeklySchedule: WeeklySchedule = {};
  
  // Initialize all days
  for (let i = 0; i < 7; i++) {
    weeklySchedule[i] = [];
  }
  
  // Group slots by day and sort by time
  slots.forEach(slot => {
    weeklySchedule[slot.dayOfWeek].push(slot);
  });
  
  // Sort slots within each day by start time
  Object.keys(weeklySchedule).forEach(day => {
    const dayNumber = Number(day);
    weeklySchedule[dayNumber].sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
  });
  
  return weeklySchedule;
};

/**
 * Extract all slots from weekly schedule
 */
export const extractSlotsFromWeeklySchedule = (weeklySchedule: WeeklySchedule): ScheduleSlot[] => {
  const allSlots: ScheduleSlot[] = [];
  
  Object.values(weeklySchedule).forEach(daySlots => {
    allSlots.push(...daySlots);
  });
  
  return allSlots;
};

/**
 * Transform multiple teacher assignments to student schedule format
 */
export const transformAssignmentsToStudentSchedule = (
  studentId: string,
  studentName: string,
  assignments: TeacherAssignmentFormData[],
  teachersMap: Map<string, { name: string; instrument?: string }>
): StudentSchedule => {
  // Group assignments by teacher
  const teacherSchedules: StudentSchedule['teacherSchedules'] = [];
  const teacherGroups: Record<string, TeacherAssignmentFormData[]> = {};
  
  assignments.forEach(assignment => {
    if (!teacherGroups[assignment.teacherId]) {
      teacherGroups[assignment.teacherId] = [];
    }
    teacherGroups[assignment.teacherId].push(assignment);
  });
  
  // Transform each teacher's assignments
  Object.entries(teacherGroups).forEach(([teacherId, teacherAssignments]) => {
    const teacherInfo = teachersMap.get(teacherId);
    const slots = teacherAssignments.map(assignment =>
      transformTeacherAssignmentToSlot(
        assignment,
        teacherInfo?.name,
        studentId,
        studentName
      )
    );
    
    teacherSchedules.push({
      teacherId,
      teacherName: teacherInfo?.name || 'מורה לא ידוע',
      instrument: teacherInfo?.instrument,
      slots,
    });
  });
  
  // Calculate total hours
  const totalMinutes = assignments.reduce((total, assignment) => total + assignment.duration, 0);
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
  
  return {
    studentId,
    studentName,
    teacherSchedules,
    totalHours,
  };
};

/**
 * Validate Hebrew day name
 */
export const isValidHebrewDay = (day: string): day is HebrewDayName => {
  return Object.values(HEBREW_DAYS).includes(day as HebrewDayName);
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate duration (positive number)
 */
export const isValidDuration = (duration: number): boolean => {
  return duration > 0 && duration <= 480; // Max 8 hours
};

/**
 * Create default schedule slot for a teacher
 */
export const createDefaultScheduleSlot = (
  teacherId: string,
  dayOfWeek: number = 0,
  startTime: string = '16:00',
  duration: number = 45
): ScheduleSlot => {
  const endTime = calculateEndTimeFromDuration(startTime, duration);
  
  return {
    id: `default-${teacherId}-${dayOfWeek}-${startTime}`,
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    duration,
    isRecurring: true,
    isActive: true,
    notes: 'Default time slot',
  };
};

/**
 * Generate time slot options for UI
 */
export const generateTimeSlotOptions = (
  startHour: number = 8,
  endHour: number = 20,
  intervalMinutes: number = 15
): string[] => {
  const options: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }
  
  return options;
};

/**
 * Get Hebrew day names in order (Sunday to Saturday)
 */
export const getHebrewDaysInOrder = (): HebrewDayName[] => {
  return [
    HEBREW_DAYS.SUNDAY,
    HEBREW_DAYS.MONDAY,
    HEBREW_DAYS.TUESDAY,
    HEBREW_DAYS.WEDNESDAY,
    HEBREW_DAYS.THURSDAY,
    HEBREW_DAYS.FRIDAY,
    HEBREW_DAYS.SATURDAY,
  ];
};

/**
 * Get working days (Sunday to Friday)
 */
export const getWorkingDaysInOrder = (): HebrewDayName[] => {
  return [
    HEBREW_DAYS.SUNDAY,
    HEBREW_DAYS.MONDAY,
    HEBREW_DAYS.TUESDAY,
    HEBREW_DAYS.WEDNESDAY,
    HEBREW_DAYS.THURSDAY,
    HEBREW_DAYS.FRIDAY,
  ];
};