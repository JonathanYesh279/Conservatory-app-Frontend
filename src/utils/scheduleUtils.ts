import { ScheduleSlot } from '../types/schedule';

/**
 * Convert time string to minutes from midnight
 * @param timeString - Time in "HH:MM" format
 * @returns Minutes from midnight
 */
export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to time string
 * @param minutes - Minutes from midnight
 * @returns Time in "HH:MM" format
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Calculate the duration of a schedule slot in minutes
 * @param slot - The schedule slot
 * @returns Duration in minutes
 */
export const calculateDuration = (slot: ScheduleSlot): number => {
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  return endMinutes - startMinutes;
};

/**
 * Format time string to display format
 * @param timeString - Time in "HH:MM" format
 * @param use12Hour - Whether to use 12-hour format
 * @returns Formatted time string
 */
export const formatTime = (timeString: string, use12Hour: boolean = true): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (use12Hour) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

/**
 * Format day of week to display format
 * @param dayOfWeek - Day of week (0-6, where 0 is Sunday)
 * @param format - Format (short, medium, long)
 * @returns Formatted day string
 */
export const formatDayOfWeek = (
  dayOfWeek: number,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const days = {
    short: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
    medium: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    long: [
      'יום ראשון',
      'יום שני',
      'יום שלישי',
      'יום רביעי',
      'יום חמישי',
      'יום שישי',
      'יום שבת',
    ],
  };

  return days[format][dayOfWeek];
};

/**
 * Sort schedule slots by day of week and start time
 * @param slots - Array of schedule slots
 * @returns Sorted array of schedule slots
 */
export const sortScheduleSlots = (slots: ScheduleSlot[]): ScheduleSlot[] => {
  return [...slots].sort((a, b) => {
    // First sort by day of week
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    
    // Then sort by start time
    const aStartMinutes = timeToMinutes(a.startTime);
    const bStartMinutes = timeToMinutes(b.startTime);
    return aStartMinutes - bStartMinutes;
  });
};

/**
 * Group schedule slots by day of week
 * @param slots - Array of schedule slots
 * @returns Object with days as keys and arrays of schedule slots as values
 */
export const groupSlotsByDay = (slots: ScheduleSlot[]): { [dayOfWeek: number]: ScheduleSlot[] } => {
  const grouped: { [dayOfWeek: number]: ScheduleSlot[] } = {};
  
  // Initialize empty arrays for each day
  for (let i = 0; i < 7; i++) {
    grouped[i] = [];
  }
  
  // Add slots to their respective days
  slots.forEach(slot => {
    grouped[slot.dayOfWeek].push(slot);
  });
  
  // Sort slots within each day
  Object.keys(grouped).forEach(day => {
    const dayNumber = Number(day);
    grouped[dayNumber] = grouped[dayNumber].sort((a, b) => {
      const aStartMinutes = timeToMinutes(a.startTime);
      const bStartMinutes = timeToMinutes(b.startTime);
      return aStartMinutes - bStartMinutes;
    });
  });
  
  return grouped;
};

/**
 * Check if two schedule slots overlap
 * @param slotA - First schedule slot
 * @param slotB - Second schedule slot
 * @returns Whether the slots overlap
 */
export const doSlotsOverlap = (slotA: ScheduleSlot, slotB: ScheduleSlot): boolean => {
  // Different days don't overlap
  if (slotA.dayOfWeek !== slotB.dayOfWeek) {
    return false;
  }
  
  const aStart = timeToMinutes(slotA.startTime);
  const aEnd = timeToMinutes(slotA.endTime);
  const bStart = timeToMinutes(slotB.startTime);
  const bEnd = timeToMinutes(slotB.endTime);
  
  // Check for overlap
  // slotA starts during slotB OR slotB starts during slotA
  return (aStart < bEnd && aEnd > bStart);
};

/**
 * Check if a schedule slot is available for a student
 * @param slot - The schedule slot to check
 * @param studentSchedule - The student's existing schedule
 * @returns Whether the slot is available
 */
export const isSlotAvailableForStudent = (
  slot: ScheduleSlot,
  studentSchedule: ScheduleSlot[]
): boolean => {
  // If the slot already has a student assigned, it's not available
  if (slot.studentId) {
    return false;
  }
  
  // Check for conflicts with existing student schedule
  return !studentSchedule.some(existingSlot => doSlotsOverlap(slot, existingSlot));
};

/**
 * Find all conflicts in a set of schedule slots
 * @param slots - Array of schedule slots
 * @returns Array of pairs of conflicting slot IDs
 */
export const findScheduleConflicts = (slots: ScheduleSlot[]): { slotA: string, slotB: string }[] => {
  const conflicts: { slotA: string, slotB: string }[] = [];
  
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (doSlotsOverlap(slots[i], slots[j])) {
        conflicts.push({ slotA: slots[i].id, slotB: slots[j].id });
      }
    }
  }
  
  return conflicts;
};

/**
 * Generate time slot options for a day
 * @param startHour - Start hour (0-23)
 * @param endHour - End hour (0-23)
 * @param interval - Interval in minutes
 * @returns Array of time strings in "HH:MM" format
 */
export const generateTimeSlotOptions = (
  startHour: number = 8,
  endHour: number = 20,
  interval: number = 15
): string[] => {
  const options: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += interval) {
    options.push(minutesToTime(minutes));
  }
  
  return options;
};

/**
 * Generate duration options in minutes
 * @returns Array of common duration options in minutes
 */
export const getDurationOptions = (): number[] => {
  return [30, 45, 60, 90, 120];
};

/**
 * Calculate end time given a start time and duration
 * @param startTime - Start time in "HH:MM" format
 * @param durationMinutes - Duration in minutes
 * @returns End time in "HH:MM" format
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
};

/**
 * Format a time slot as a readable string
 * @param slot - The schedule slot
 * @returns Formatted string (e.g., "Monday, 3:30 PM - 4:15 PM")
 */
export const formatTimeSlot = (slot: ScheduleSlot): string => {
  const day = formatDayOfWeek(slot.dayOfWeek, 'medium');
  const start = formatTime(slot.startTime);
  const end = formatTime(slot.endTime);
  return `${day}, ${start} - ${end}`;
};

/**
 * Check if a time is within operating hours
 * @param timeString - Time in "HH:MM" format
 * @param startHour - Start hour of operating hours (0-23)
 * @param endHour - End hour of operating hours (0-23)
 * @returns Whether the time is within operating hours
 */
export const isWithinOperatingHours = (
  timeString: string,
  startHour: number = 8,
  endHour: number = 20
): boolean => {
  const minutes = timeToMinutes(timeString);
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  return minutes >= startMinutes && minutes <= endMinutes;
};