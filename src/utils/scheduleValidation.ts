import * as Yup from 'yup';
import { ScheduleSlot } from '../services/scheduleService';
import { timeToMinutes, doSlotsOverlap } from './scheduleUtils';

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