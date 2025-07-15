// src/utils/theoryConflictDetection.ts

import { TheoryLesson } from '../services/theoryService';

export interface TheoryConflict {
  type: 'room' | 'teacher';
  existingLesson: TheoryLesson;
  newLesson: Partial<TheoryLesson>;
  conflictDate: string;
  description: string;
}

/**
 * Convert time string to minutes from midnight
 */
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap
 */
const doTimesOverlap = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);
  
  // Check for overlap: range1 starts during range2 OR range2 starts during range1
  return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
};

/**
 * Generate all dates for a recurring lesson within a date range
 */
const generateLessonDates = (
  startDate: string,
  endDate: string,
  dayOfWeek: number,
  excludeDates: string[] = []
): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Find the first occurrence of the target day of week
  const current = new Date(start);
  while (current.getDay() !== dayOfWeek && current <= end) {
    current.setDate(current.getDate() + 1);
  }
  
  // Generate all dates for this day of week
  while (current <= end) {
    const dateString = current.toISOString().split('T')[0];
    if (!excludeDates.includes(dateString)) {
      dates.push(dateString);
    }
    current.setDate(current.getDate() + 7); // Move to next week
  }
  
  return dates;
};

/**
 * Check for conflicts between new bulk theory lessons and existing lessons
 */
export const checkTheoryLessonConflicts = (
  existingLessons: TheoryLesson[],
  newBulkData: {
    startDate: string;
    endDate: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
    teacherId: string;
    excludeDates?: string[];
  }
): TheoryConflict[] => {
  const conflicts: TheoryConflict[] = [];
  
  // Generate all dates for the new bulk lessons
  const newLessonDates = generateLessonDates(
    newBulkData.startDate,
    newBulkData.endDate,
    newBulkData.dayOfWeek,
    newBulkData.excludeDates
  );
  
  // Check each generated date against existing lessons
  newLessonDates.forEach(lessonDate => {
    existingLessons.forEach(existingLesson => {
      const existingDate = existingLesson.date.split('T')[0]; // Convert to YYYY-MM-DD
      
      // Skip if different dates
      if (existingDate !== lessonDate) {
        return;
      }
      
      // Check for time overlap
      const timesOverlap = doTimesOverlap(
        newBulkData.startTime,
        newBulkData.endTime,
        existingLesson.startTime,
        existingLesson.endTime
      );
      
      if (!timesOverlap) {
        return;
      }
      
      // Check for room conflict (same location at overlapping times)
      if (existingLesson.location === newBulkData.location) {
        conflicts.push({
          type: 'room',
          existingLesson,
          newLesson: {
            date: lessonDate,
            startTime: newBulkData.startTime,
            endTime: newBulkData.endTime,
            location: newBulkData.location,
            teacherId: newBulkData.teacherId
          },
          conflictDate: lessonDate,
          description: `Room conflict: ${newBulkData.location} is already booked on ${lessonDate} from ${existingLesson.startTime}-${existingLesson.endTime} (existing lesson) vs ${newBulkData.startTime}-${newBulkData.endTime} (new lesson)`
        });
      }
      
      // Check for teacher conflict (same teacher at overlapping times)
      if (existingLesson.teacherId === newBulkData.teacherId && existingLesson.location !== newBulkData.location) {
        conflicts.push({
          type: 'teacher',
          existingLesson,
          newLesson: {
            date: lessonDate,
            startTime: newBulkData.startTime,
            endTime: newBulkData.endTime,
            location: newBulkData.location,
            teacherId: newBulkData.teacherId
          },
          conflictDate: lessonDate,
          description: `Teacher conflict: Teacher is already scheduled on ${lessonDate} from ${existingLesson.startTime}-${existingLesson.endTime} in ${existingLesson.location} vs ${newBulkData.startTime}-${newBulkData.endTime} in ${newBulkData.location}`
        });
      }
    });
  });
  
  return conflicts;
};

/**
 * Check for conflicts when creating a single theory lesson
 */
export const checkSingleTheoryLessonConflicts = (
  existingLessons: TheoryLesson[],
  newLesson: Partial<TheoryLesson>
): TheoryConflict[] => {
  const conflicts: TheoryConflict[] = [];
  
  if (!newLesson.date || !newLesson.startTime || !newLesson.endTime || !newLesson.location) {
    return conflicts;
  }
  
  const newDate = newLesson.date.split('T')[0];
  
  existingLessons.forEach(existingLesson => {
    const existingDate = existingLesson.date.split('T')[0];
    
    // Skip if different dates
    if (existingDate !== newDate) {
      return;
    }
    
    // Check for time overlap
    const timesOverlap = doTimesOverlap(
      newLesson.startTime!,
      newLesson.endTime!,
      existingLesson.startTime,
      existingLesson.endTime
    );
    
    if (!timesOverlap) {
      return;
    }
    
    // Check for room conflict
    if (existingLesson.location === newLesson.location) {
      conflicts.push({
        type: 'room',
        existingLesson,
        newLesson,
        conflictDate: newDate,
        description: `Room conflict: ${newLesson.location} is already booked on ${newDate} from ${existingLesson.startTime}-${existingLesson.endTime}`
      });
    }
    
    // Check for teacher conflict
    if (existingLesson.teacherId === newLesson.teacherId && existingLesson.location !== newLesson.location) {
      conflicts.push({
        type: 'teacher',
        existingLesson,
        newLesson,
        conflictDate: newDate,
        description: `Teacher conflict: Teacher is already scheduled on ${newDate} from ${existingLesson.startTime}-${existingLesson.endTime} in ${existingLesson.location}`
      });
    }
  });
  
  return conflicts;
};

/**
 * Format conflicts for display to user
 */
export const formatConflictsForUser = (conflicts: TheoryConflict[]): string => {
  if (conflicts.length === 0) {
    return '';
  }
  
  const roomConflicts = conflicts.filter(c => c.type === 'room');
  const teacherConflicts = conflicts.filter(c => c.type === 'teacher');
  
  let message = 'נמצאו התנגשויות בלוח הזמנים:\n\n';
  
  if (roomConflicts.length > 0) {
    message += `התנגשויות חדרים (${roomConflicts.length}):\n`;
    roomConflicts.forEach((conflict, index) => {
      message += `${index + 1}. ${conflict.conflictDate} - ${conflict.existingLesson.location}\n`;
    });
    message += '\n';
  }
  
  if (teacherConflicts.length > 0) {
    message += `התנגשויות מורים (${teacherConflicts.length}):\n`;
    teacherConflicts.forEach((conflict, index) => {
      message += `${index + 1}. ${conflict.conflictDate}\n`;
    });
  }
  
  message += '\nהאם ברצונך להמשיך למרות ההתנגשויות?';
  
  return message;
};