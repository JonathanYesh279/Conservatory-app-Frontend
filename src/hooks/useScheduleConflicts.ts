import { useMemo, useCallback } from 'react';
import { ScheduleSlot } from '../types/schedule';
import { useScheduleStore } from '../store/scheduleStore';
import { doSlotsOverlap, formatTimeSlot } from '../utils/scheduleUtils';

interface ConflictDetails {
  slotA: ScheduleSlot;
  slotB: ScheduleSlot;
  type: 'teacher' | 'student' | 'both';
  description: string;
}

interface UseScheduleConflictsReturn {
  // Data
  hasConflicts: boolean;
  conflictsCount: number;
  conflictDetails: ConflictDetails[];
  
  // Helper methods
  isSlotConflicting: (slotId: string) => boolean;
  getSlotConflicts: (slotId: string) => ConflictDetails[];
  getConflictDescription: (conflict: ConflictDetails) => string;
  getConflictSuggestions: (conflict: ConflictDetails) => string[];
}

/**
 * Finds detailed information about a specific conflict
 */
const findConflictDetails = (
  conflicts: import('../types/schedule').ScheduleConflict[],
  allSlots: ScheduleSlot[]
): ConflictDetails[] => {
  return conflicts.map(conflict => {
    const slotAId = typeof conflict.slotA === 'string' ? conflict.slotA : conflict.slotA?.id;
    const slotBId = typeof conflict.slotB === 'string' ? conflict.slotB : conflict.slotB?.id;
    
    const slotA = typeof conflict.slotA === 'object' ? conflict.slotA : 
                  allSlots.find(slot => slot.id === slotAId);
    const slotB = typeof conflict.slotB === 'object' ? conflict.slotB : 
                  allSlots.find(slot => slot.id === slotBId);
    
    if (!slotA || !slotB) {
      throw new Error(`Conflict references missing slots: ${slotAId}, ${slotBId}`);
    }
    
    // Determine conflict type
    let type: 'teacher' | 'student' | 'both' = 'teacher';
    
    if (slotA.studentId && slotB.studentId && slotA.studentId === slotB.studentId) {
      type = 'student';
    }
    
    if (slotA.studentId && slotB.studentId && slotA.studentId === slotB.studentId) {
      type = 'both';
    }
    
    // Create description
    let description = '';
    
    if (type === 'teacher') {
      description = `Teacher schedule conflict: ${formatTimeSlot(slotA)} overlaps with ${formatTimeSlot(slotB)}`;
    } else if (type === 'student') {
      description = `Student ${slotA.studentName} is scheduled at overlapping times: ${formatTimeSlot(slotA)} and ${formatTimeSlot(slotB)}`;
    } else {
      description = `Both teacher and student ${slotA.studentName} have conflicting schedules at ${formatTimeSlot(slotA)} and ${formatTimeSlot(slotB)}`;
    }
    
    return {
      slotA,
      slotB,
      type,
      description
    };
  });
};

/**
 * Hook for managing and resolving schedule conflicts
 */
const useScheduleConflicts = (): UseScheduleConflictsReturn => {
  // Get store state
  const { conflicts, currentTeacherSchedule } = useScheduleStore();
  
  // Extract all slots from the schedule
  const allSlots = useMemo(() => {
    if (!currentTeacherSchedule) return [];
    
    const slots: ScheduleSlot[] = [];
    Object.values(currentTeacherSchedule).forEach(daySlots => {
      slots.push(...daySlots);
    });
    
    return slots;
  }, [currentTeacherSchedule]);
  
  // Get detailed conflict information
  const conflictDetails = useMemo(() => {
    if (!conflicts.length || !allSlots.length) return [];
    return findConflictDetails(conflicts, allSlots);
  }, [conflicts, allSlots]);
  
  // Check if a specific slot has conflicts
  const isSlotConflicting = useCallback(
    (slotId: string): boolean => {
      return conflicts.some(
        conflict => 
          (typeof conflict.slotA === 'string' ? conflict.slotA === slotId : conflict.slotA?.id === slotId) ||
          (typeof conflict.slotB === 'string' ? conflict.slotB === slotId : conflict.slotB?.id === slotId)
      );
    },
    [conflicts]
  );
  
  // Get all conflicts for a specific slot
  const getSlotConflicts = useCallback(
    (slotId: string): ConflictDetails[] => {
      return conflictDetails.filter(
        conflict => conflict.slotA.id === slotId || conflict.slotB.id === slotId
      );
    },
    [conflictDetails]
  );
  
  // Get a description of a conflict
  const getConflictDescription = useCallback(
    (conflict: ConflictDetails): string => {
      return conflict.description;
    },
    []
  );
  
  // Get suggestions for resolving a conflict
  const getConflictSuggestions = useCallback(
    (conflict: ConflictDetails): string[] => {
      const suggestions: string[] = [];
      
      if (conflict.type === 'teacher' || conflict.type === 'both') {
        suggestions.push(`Reschedule one of the conflicting slots to a different time or day`);
        suggestions.push(`Remove one of the conflicting slots`);
      }
      
      if (conflict.type === 'student' || conflict.type === 'both') {
        suggestions.push(`Assign a different student to one of the slots`);
        suggestions.push(`Remove the student from one of the slots`);
      }
      
      suggestions.push(`If this is intentional, you can ignore this conflict`);
      
      return suggestions;
    },
    []
  );
  
  return {
    hasConflicts: conflicts.length > 0,
    conflictsCount: conflicts.length,
    conflictDetails,
    isSlotConflicting,
    getSlotConflicts,
    getConflictDescription,
    getConflictSuggestions
  };
};

export { useScheduleConflicts };