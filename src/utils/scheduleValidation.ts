import * as Yup from 'yup';
import { ScheduleSlot } from '../types/schedule';
import { timeToMinutes, doSlotsOverlap, isWithinOperatingHours } from './scheduleUtils';
import {
  isValidTimeFormat,
  isValidDuration,
  isValidHebrewDay,
} from './scheduleTransformations';
import type {
  ScheduleConflict,
  ConflictDetectionResult,
  TimeSlotValidation,
  ScheduleValidationResult,
  TeacherAssignmentFormData,
} from '../types/schedule';

// Validation schemas
export const timeSlotSchema = Yup.object().shape({
  dayOfWeek: Yup.number()
    .required('Day of week is required')
    .min(0, 'Invalid day')
    .max(6, 'Invalid day'),
  startTime: Yup.string()
    .required('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: Yup.string()
    .required('End time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .test('is-after-start', 'End time must be after start time', function(endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      return endMinutes > startMinutes;
    }),
  location: Yup.string().nullable(),
  notes: Yup.string().nullable(),
  isRecurring: Yup.boolean().required('Please specify if this is a recurring slot')
});

export const assignStudentSchema = Yup.object().shape({
  scheduleSlotId: Yup.string().required('Schedule slot is required'),
  studentId: Yup.string().required('Student is required')
});

/**
 * Validate if a new slot conflicts with existing slots
 * @param newSlot - The new slot to validate
 * @param existingSlots - Existing slots to check against
 * @returns Error message if conflict exists, null otherwise
 */
export const validateSlotConflicts = (
  newSlot: Partial<ScheduleSlot>,
  existingSlots: ScheduleSlot[]
): string | null => {
  // Skip validation if required fields are missing
  if (
    newSlot.dayOfWeek === undefined ||
    !newSlot.startTime ||
    !newSlot.endTime
  ) {
    return null;
  }
  
  // Create a temporary complete slot for validation
  const tempSlot: ScheduleSlot = {
    id: newSlot.id || 'temp-id',
    teacherId: newSlot.teacherId || 'temp-teacher',
    dayOfWeek: newSlot.dayOfWeek,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime,
    isRecurring: newSlot.isRecurring || false,
    isActive: true,
    location: newSlot.location,
    notes: newSlot.notes,
    studentId: newSlot.studentId,
    studentName: newSlot.studentName
  };
  
  // Find conflicts
  const conflictingSlot = existingSlots.find(existingSlot => {
    // Skip comparing with itself if updating
    if (existingSlot.id === newSlot.id) return false;
    
    return doSlotsOverlap(tempSlot, existingSlot);
  });
  
  if (conflictingSlot) {
    return `This slot conflicts with an existing slot: ${conflictingSlot.startTime} - ${conflictingSlot.endTime}${
      conflictingSlot.studentName ? ` (${conflictingSlot.studentName})` : ''
    }`;
  }
  
  return null;
};

/**
 * Validate if a student can be assigned to a slot
 * @param slotId - The ID of the slot to assign
 * @param studentId - The ID of the student to assign
 * @param slot - The slot to assign
 * @param studentSchedule - The student's existing schedule
 * @returns Error message if assignment is invalid, null otherwise
 */
export const validateStudentAssignment = (
  slotId: string,
  studentId: string,
  slot: ScheduleSlot,
  studentSchedule: ScheduleSlot[]
): string | null => {
  // Check if the slot already has a student assigned
  if (slot.studentId && slot.studentId !== studentId) {
    return 'This slot is already assigned to another student';
  }
  
  // Skip conflict check if the student is already assigned to this slot
  if (slot.studentId === studentId) {
    return null;
  }
  
  // Find conflicts with the student's existing schedule
  const conflictingSlot = studentSchedule.find(existingSlot => {
    // Skip comparing with slots from the same teacher if updating
    if (existingSlot.id === slotId) return false;
    
    return doSlotsOverlap(slot, existingSlot);
  });
  
  if (conflictingSlot) {
    return `This assignment conflicts with the student's existing schedule: ${conflictingSlot.startTime} - ${conflictingSlot.endTime}`;
  }
  
  return null;
};

/**
 * Generate error messages for schedule slot validation
 * @param error - The validation error
 * @returns User-friendly error message
 */
export const getScheduleErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && error.message) {
    return error.message;
  }
  
  if (error && error.errors && error.errors.length > 0) {
    return error.errors[0];
  }
  
  return 'An error occurred with schedule validation';
};

/**
 * Validate a single time slot with Hebrew error messages
 */
export const validateTimeSlot = (
  startTime: string,
  endTime: string,
  duration?: number
): TimeSlotValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate time format
  if (!isValidTimeFormat(startTime)) {
    errors.push('שעת התחלה לא תקינה');
  }

  if (!isValidTimeFormat(endTime)) {
    errors.push('שעת סיום לא תקינה');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate time logic
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    errors.push('שעת התחלה חייבת להיות לפני שעת הסיום');
  }

  const calculatedDuration = endMinutes - startMinutes;

  // Validate duration if provided
  if (duration && !isValidDuration(duration)) {
    errors.push('משך השיעור לא תקין');
  }

  if (duration && Math.abs(calculatedDuration - duration) > 5) {
    warnings.push('משך השיעור לא תואם לזמני ההתחלה והסיום');
  }

  // Check operating hours
  if (!isWithinOperatingHours(startTime)) {
    warnings.push('שעת ההתחלה מחוץ לשעות הפעילות הרגילות');
  }

  if (!isWithinOperatingHours(endTime)) {
    warnings.push('שעת הסיום מחוץ לשעות הפעילות הרגילות');
  }

  // Check duration limits
  if (calculatedDuration < 15) {
    errors.push('משך השיעור חייב להיות לפחות 15 דקות');
  }

  if (calculatedDuration > 240) {
    warnings.push('משך השיעור ארוך מהרגיל (יותר מ-4 שעות)');
  }

  // Check common lesson durations
  const commonDurations = [30, 45, 60, 90, 120];
  if (!commonDurations.includes(calculatedDuration)) {
    warnings.push('משך השיעור לא סטנדרטי');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate teacher assignment form data
 */
export const validateTeacherAssignment = (
  assignment: TeacherAssignmentFormData
): TimeSlotValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!assignment.teacherId) {
    errors.push('יש לבחור מורה');
  }

  if (!isValidHebrewDay(assignment.day)) {
    errors.push('יום השבוע לא תקין');
  }

  if (!isValidTimeFormat(assignment.time)) {
    errors.push('שעה לא תקינה');
  }

  if (!isValidDuration(assignment.duration)) {
    errors.push('משך השיעור לא תקין');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Validate time slot logic
  const endTime = calculateEndTime(assignment.time, assignment.duration);
  const timeValidation = validateTimeSlot(assignment.time, endTime, assignment.duration);

  return {
    isValid: timeValidation.isValid,
    errors: [...errors, ...timeValidation.errors],
    warnings: [...warnings, ...timeValidation.warnings],
  };
};

/**
 * Calculate end time from start time and duration
 */
const calculateEndTime = (startTime: string, duration: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  const hours = Math.floor(endMinutes / 60);
  const minutes = endMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Detect conflicts between schedule slots
 */
export const detectScheduleConflicts = (slots: ScheduleSlot[]): ConflictDetectionResult => {
  const conflicts: ScheduleConflict[] = [];
  const suggestions: string[] = [];

  // Group slots by teacher
  const slotsByTeacher: Record<string, ScheduleSlot[]> = {};
  slots.forEach(slot => {
    if (!slotsByTeacher[slot.teacherId]) {
      slotsByTeacher[slot.teacherId] = [];
    }
    slotsByTeacher[slot.teacherId].push(slot);
  });

  // Check for conflicts within each teacher's schedule
  Object.entries(slotsByTeacher).forEach(([teacherId, teacherSlots]) => {
    for (let i = 0; i < teacherSlots.length; i++) {
      for (let j = i + 1; j < teacherSlots.length; j++) {
        const slotA = teacherSlots[i];
        const slotB = teacherSlots[j];

        if (doSlotsOverlap(slotA, slotB)) {
          conflicts.push({
            type: 'overlap',
            slotA,
            slotB,
            message: `התנגשות בין שיעורים - ${slotA.startTime} ו-${slotB.startTime}`,
            severity: 'error',
          });

          // Add suggestion for resolution
          if (slotA.dayOfWeek === slotB.dayOfWeek) {
            suggestions.push(`העבר אחד מהשיעורים ליום אחר או שנה את השעה`);
          } else {
            suggestions.push(`בדוק את זמני השיעורים - ייתכן שהם חופפים`);
          }
        }
      }

      // Check for invalid time slots
      const slot = teacherSlots[i];
      const validation = validateTimeSlot(slot.startTime, slot.endTime);
      
      if (!validation.isValid) {
        conflicts.push({
          type: 'invalid_time',
          slotA: slot,
          message: `זמן שיעור לא תקין: ${validation.errors.join(', ')}`,
          severity: 'error',
        });
      }

      if (validation.warnings.length > 0) {
        conflicts.push({
          type: 'invalid_time',
          slotA: slot,
          message: `אזהרה: ${validation.warnings.join(', ')}`,
          severity: 'warning',
        });
      }
    }
  });

  // Check for double-booked students
  const slotsByStudent: Record<string, ScheduleSlot[]> = {};
  slots.forEach(slot => {
    if (slot.studentId) {
      if (!slotsByStudent[slot.studentId]) {
        slotsByStudent[slot.studentId] = [];
      }
      slotsByStudent[slot.studentId].push(slot);
    }
  });

  Object.entries(slotsByStudent).forEach(([studentId, studentSlots]) => {
    for (let i = 0; i < studentSlots.length; i++) {
      for (let j = i + 1; j < studentSlots.length; j++) {
        const slotA = studentSlots[i];
        const slotB = studentSlots[j];

        if (doSlotsOverlap(slotA, slotB)) {
          conflicts.push({
            type: 'double_booking',
            slotA,
            slotB,
            message: `התלמיד ${slotA.studentName || 'לא ידוע'} משוייך לשני שיעורים חופפים`,
            severity: 'error',
          });

          suggestions.push('העבר אחד מהשיעורים של התלמיד לזמן אחר');
        }
      }
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    suggestions: [...new Set(suggestions)], // Remove duplicates
  };
};

/**
 * Check if a student can be assigned to a specific slot without conflicts
 */
export const canAssignStudentToSlot = (
  slot: ScheduleSlot,
  studentSchedule: ScheduleSlot[]
): { canAssign: boolean; reason?: string } => {
  // Check if slot is already occupied
  if (slot.studentId) {
    return {
      canAssign: false,
      reason: 'משבצת הזמן תפוסה על ידי תלמיד אחר',
    };
  }

  // Check for conflicts with student's existing schedule
  const conflicts = studentSchedule.filter(existingSlot => 
    doSlotsOverlap(slot, existingSlot)
  );

  if (conflicts.length > 0) {
    const getDayName = (day: number) => {
      const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      return days[day] || 'לא ידוע';
    };

    return {
      canAssign: false,
      reason: `התנגשות עם שיעור קיים ב${getDayName(conflicts[0].dayOfWeek)} בשעה ${conflicts[0].startTime}`,
    };
  }

  return { canAssign: true };
};