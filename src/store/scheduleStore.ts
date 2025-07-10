import { create } from 'zustand';
import { scheduleService, timeBlockService } from '../services/scheduleService';
import {
  ScheduleSlot,
  WeeklySchedule,
  StudentSchedule,
  TeacherSchedule,
  CreateScheduleSlotRequest,
  AssignStudentRequest,
  UpdateScheduleSlotRequest,
  ScheduleConflict,
  ScheduleFilters,
  GetAvailableSlotsRequest,
  // Time Block System imports
  TimeBlock,
  LessonAssignment,
  AvailableSlot,
  CreateTimeBlockRequest,
  TimeBlockFormData,
  LessonDurationMinutes,
  HebrewDayName,
  HEBREW_TO_NUMERIC_DAYS,
  SlotSearchCriteria,
  AssignLessonRequest
} from '../types/schedule';
import { findScheduleConflicts } from '../utils/scheduleUtils';
import { extractSlotsFromWeeklySchedule } from '../utils/scheduleTransformations';

interface ScheduleState {
  // Legacy Teacher schedule data (for backward compatibility)
  currentTeacherSchedule: WeeklySchedule | null;
  currentTeacherScheduleMetadata: TeacherSchedule | null;
  availableSlots: ScheduleSlot[];
  selectedSlot: ScheduleSlot | null;
  
  // NEW TIME BLOCK SYSTEM - Following the guide
  // Time Block Management
  teacherTimeBlocks: Record<string, TimeBlock[]>;
  selectedTimeBlock: TimeBlock | null;
  timeBlockStats: Record<string, any>;
  
  // Enhanced Slot Discovery
  availableTimeSlots: AvailableSlot[];
  slotSearchCriteria: {
    teacherId?: string;
    duration?: LessonDurationMinutes;
    preferredDays?: HebrewDayName[];
    preferredTimeRange?: {
      startTime: string;
      endTime: string;
    };
  } | null;
  lastSearchResults: any | null;
  
  // Assignment Management
  activeAssignments: LessonAssignment[];
  assignmentConflicts: ScheduleConflict[];
  recentAssignmentHistory: LessonAssignment[];
  
  // UI State for Time Block System
  selectedDuration: LessonDurationMinutes;
  selectedDay: HebrewDayName | null;
  isCreatingTimeBlock: boolean;
  isCalculatingSlots: boolean;
  isAssigningLesson: boolean;
  viewMode: 'blocks' | 'timeline' | 'calendar';
  
  // Student schedule data
  currentStudentSchedule: StudentSchedule | null;
  
  // Conflicts and validation
  conflicts: ScheduleConflict[];
  lastConflictCheck: string | null;
  
  // Legacy UI states (for backward compatibility)
  isLoadingTeacherSchedule: boolean;
  isLoadingStudentSchedule: boolean;
  isLoadingAvailableSlots: boolean;
  isCreatingSlot: boolean;
  isUpdatingSlot: boolean;
  isAssigningStudent: boolean;
  isCheckingConflicts: boolean;
  
  // Errors
  error: string | null;
  errorDetails: any;
  
  // Cache management
  cacheTimestamp: number;
  lastUpdated: Record<string, Date>;
  pendingOperations: string[];
  
  // NEW TIME BLOCK ACTIONS - Following the guide
  // Time Block Management
  createTimeBlock: (teacherId: string, timeBlockData: CreateTimeBlockRequest) => Promise<TimeBlock | null>;
  updateTimeBlock: (timeBlockId: string, updateData: Partial<TimeBlockFormData>) => Promise<TimeBlock | null>;
  deleteTimeBlock: (timeBlockId: string) => Promise<boolean>;
  loadTeacherTimeBlocks: (teacherId: string, includeStats?: boolean) => Promise<void>;
  
  // Enhanced Slot Discovery
  searchAvailableSlots: (criteria: {
    teacherId: string;
    duration: LessonDurationMinutes;
    preferredDays?: HebrewDayName[];
    preferredTimeRange?: { startTime: string; endTime: string };
  }) => Promise<AvailableSlot[]>;
  
  // Intelligent Assignment
  assignLessonToTimeBlock: (assignmentData: {
    timeBlockId: string;
    studentId: string;
    lessonStartTime: string;
    duration: LessonDurationMinutes;
  }) => Promise<LessonAssignment | null>;
  
  // UI State Management
  setSelectedTimeBlock: (timeBlock: TimeBlock | null) => void;
  setSelectedDuration: (duration: LessonDurationMinutes) => void;
  setSelectedDay: (day: HebrewDayName | null) => void;
  setViewMode: (mode: 'blocks' | 'timeline' | 'calendar') => void;
  
  // Legacy Actions - Teacher Schedule (for backward compatibility)
  loadTeacherSchedule: (teacherId: string, includeStudentInfo?: boolean) => Promise<void>;
  loadTeacherScheduleMetadata: (teacherId: string, includeStudentInfo?: boolean) => Promise<void>;
  loadAvailableSlots: (teacherId: string, filters?: Partial<GetAvailableSlotsRequest>) => Promise<ScheduleSlot[]>;
  createTimeSlot: (teacherId: string, slotData: CreateScheduleSlotRequest) => Promise<ScheduleSlot | null>;
  updateTimeSlot: (scheduleSlotId: string, updateData: UpdateScheduleSlotRequest) => Promise<ScheduleSlot | null>;
  deleteTimeSlot: (scheduleSlotId: string) => Promise<boolean>;
  
  // Actions - Student Assignment
  assignStudent: (assignmentData: AssignStudentRequest) => Promise<ScheduleSlot | null>;
  removeStudent: (scheduleSlotId: string) => Promise<ScheduleSlot | null>;
  bulkAssignStudents: (assignments: AssignStudentRequest[]) => Promise<ScheduleSlot[]>;
  loadStudentSchedule: (studentId: string) => Promise<void>;
  
  // Actions - Conflict Detection
  checkScheduleConflicts: (teacherId?: string) => Promise<void>;
  resolveConflict: (conflictId: string) => Promise<void>;
  
  // Actions - Search and Filters
  searchScheduleSlots: (filters: ScheduleFilters) => Promise<ScheduleSlot[]>;
  
  // UI Actions
  setSelectedSlot: (slot: ScheduleSlot | null) => void;
  clearErrors: () => void;
  clearCache: () => void;
  resetState: () => void;
  
  // Utility Actions
  getAvailableSlots: (teacherId: string, filters?: Partial<GetAvailableSlotsRequest>) => Promise<ScheduleSlot[]>;
  isSlotConflicting: (slot: ScheduleSlot) => boolean;
  getTeacherScheduleStats: (teacherId: string) => Promise<any>;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state
  currentTeacherSchedule: null,
  currentTeacherScheduleMetadata: null,
  availableSlots: [],
  selectedSlot: null,
  currentStudentSchedule: null,
  conflicts: [],
  lastConflictCheck: null,
  isLoadingTeacherSchedule: false,
  isLoadingStudentSchedule: false,
  isLoadingAvailableSlots: false,
  isCreatingSlot: false,
  isUpdatingSlot: false,
  isAssigningStudent: false,
  isCheckingConflicts: false,
  error: null,
  errorDetails: null,
  cacheTimestamp: 0,
  
  // NEW TIME BLOCK SYSTEM INITIAL STATE
  teacherTimeBlocks: {},
  selectedTimeBlock: null,
  timeBlockStats: {},
  availableTimeSlots: [],
  slotSearchCriteria: null,
  lastSearchResults: null,
  activeAssignments: [],
  assignmentConflicts: [],
  recentAssignmentHistory: [],
  selectedDuration: 60,
  selectedDay: null,
  isCreatingTimeBlock: false,
  isCalculatingSlots: false,
  isAssigningLesson: false,
  viewMode: 'blocks',
  lastUpdated: {},
  pendingOperations: [],
  
  // Teacher Schedule Actions
  loadTeacherSchedule: async (teacherId: string, includeStudentInfo = true) => {
    const state = get();
    
    // Check cache validity
    if (state.currentTeacherSchedule && isCacheValid(state.cacheTimestamp)) {
      return;
    }
    
    try {
      set({ isLoadingTeacherSchedule: true, error: null });
      const schedule = await scheduleService.getTeacherWeeklySchedule(teacherId, includeStudentInfo);
      
      // Calculate conflicts
      const allSlots = extractSlotsFromWeeklySchedule(schedule);
      const conflicts = findScheduleConflicts(allSlots);
      
      set({ 
        currentTeacherSchedule: schedule, 
        isLoadingTeacherSchedule: false,
        conflicts: conflicts.map(conflict => ({
          type: 'overlap' as const,
          slotA: allSlots.find(s => s.id === conflict.slotA)!,
          slotB: allSlots.find(s => s.id === conflict.slotB)!,
          message: 'משבצות זמן חופפות',
          severity: 'error' as const,
        })),
        cacheTimestamp: Date.now(),
        lastConflictCheck: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load teacher schedule:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת מערכת השעות של המורה', 
        errorDetails: error,
        isLoadingTeacherSchedule: false 
      });
    }
  },
  
  loadTeacherScheduleMetadata: async (teacherId: string, includeStudentInfo = true) => {
    try {
      set({ isLoadingTeacherSchedule: true, error: null });
      const teacherSchedule = await scheduleService.getTeacherSchedule(teacherId, includeStudentInfo);
      
      set({ 
        currentTeacherScheduleMetadata: teacherSchedule,
        currentTeacherSchedule: teacherSchedule.weeklySchedule,
        isLoadingTeacherSchedule: false,
        cacheTimestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to load teacher schedule metadata:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת נתוני מערכת השעות', 
        errorDetails: error,
        isLoadingTeacherSchedule: false 
      });
    }
  },
  
  loadAvailableSlots: async (teacherId: string, filters?: Partial<GetAvailableSlotsRequest>) => {
    try {
      set({ isLoadingAvailableSlots: true, error: null });
      // Use the updated service method that handles time block conversion
      const slots = await scheduleService.getAvailableSlots(teacherId, filters);
      
      set({ availableSlots: slots, isLoadingAvailableSlots: false });
      return slots;
    } catch (error) {
      console.error('Failed to load available slots:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת השעות הזמינות', 
        errorDetails: error,
        isLoadingAvailableSlots: false 
      });
      return [];
    }
  },
  
  createTimeSlot: async (teacherId: string, slotData: CreateScheduleSlotRequest) => {
    try {
      set({ isCreatingSlot: true, error: null });
      const newSlot = await scheduleService.createScheduleSlot(teacherId, slotData);
      
      // Update the teacher schedule with the new slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        const daySlots = updatedSchedule[newSlot.dayOfWeek] || [];
        updatedSchedule[newSlot.dayOfWeek] = [...daySlots, newSlot].sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        );
        
        // Recalculate conflicts
        const allSlots = extractSlotsFromWeeklySchedule(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts: conflicts.map(conflict => ({
            type: 'overlap' as const,
            slotA: allSlots.find(s => s.id === conflict.slotA)!,
            slotB: allSlots.find(s => s.id === conflict.slotB)!,
            message: 'משבצות זמן חופפות',
            severity: 'error' as const,
          })),
          isCreatingSlot: false,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isCreatingSlot: false });
      }
      
      return newSlot;
    } catch (error) {
      console.error('Failed to create time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה ביצירת משבצת זמן חדשה', 
        errorDetails: error,
        isCreatingSlot: false 
      });
      return null;
    }
  },
  
  updateTimeSlot: async (scheduleSlotId: string, updateData: UpdateScheduleSlotRequest) => {
    try {
      set({ isUpdatingSlot: true, error: null });
      const updatedSlot = await scheduleService.updateScheduleSlot(scheduleSlotId, updateData);
      
      // Update the teacher schedule with the updated slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        
        // Remove the slot from its original day if present
        Object.keys(updatedSchedule).forEach(dayKey => {
          const day = Number(dayKey);
          updatedSchedule[day] = updatedSchedule[day].filter(slot => slot.id !== scheduleSlotId);
        });
        
        // Add the updated slot to the correct day
        const daySlots = updatedSchedule[updatedSlot.dayOfWeek] || [];
        updatedSchedule[updatedSlot.dayOfWeek] = [...daySlots, updatedSlot].sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        );
        
        // Recalculate conflicts
        const allSlots = extractSlotsFromWeeklySchedule(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts: conflicts.map(conflict => ({
            type: 'overlap' as const,
            slotA: allSlots.find(s => s.id === conflict.slotA)!,
            slotB: allSlots.find(s => s.id === conflict.slotB)!,
            message: 'משבצות זמן חופפות',
            severity: 'error' as const,
          })),
          isUpdatingSlot: false,
          selectedSlot: get().selectedSlot?.id === scheduleSlotId ? updatedSlot : get().selectedSlot,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isUpdatingSlot: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to update time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בעדכון משבצת הזמן', 
        errorDetails: error,
        isUpdatingSlot: false 
      });
      return null;
    }
  },
  
  deleteTimeSlot: async (scheduleSlotId: string) => {
    try {
      set({ isUpdatingSlot: true, error: null });
      await scheduleService.deleteScheduleSlot(scheduleSlotId);
      
      // Update the teacher schedule by removing the slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        
        // Remove the slot from its day
        Object.keys(updatedSchedule).forEach(dayKey => {
          const day = Number(dayKey);
          updatedSchedule[day] = updatedSchedule[day].filter(slot => slot.id !== scheduleSlotId);
        });
        
        // Recalculate conflicts
        const allSlots = extractSlotsFromWeeklySchedule(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts: conflicts.map(conflict => ({
            type: 'overlap' as const,
            slotA: allSlots.find(s => s.id === conflict.slotA)!,
            slotB: allSlots.find(s => s.id === conflict.slotB)!,
            message: 'משבצות זמן חופפות',
            severity: 'error' as const,
          })),
          isUpdatingSlot: false,
          selectedSlot: get().selectedSlot?.id === scheduleSlotId ? null : get().selectedSlot,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isUpdatingSlot: false });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה במחיקת משבצת הזמן', 
        errorDetails: error,
        isUpdatingSlot: false 
      });
      return false;
    }
  },
  
  // Student Assignment Actions
  assignStudent: async (assignmentData: AssignStudentRequest) => {
    try {
      set({ isAssigningStudent: true, error: null });
      const updatedSlot = await scheduleService.assignStudentToSlot(assignmentData);
      
      // Update the teacher schedule with the updated slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        const daySlots = updatedSchedule[updatedSlot.dayOfWeek] || [];
        const slotIndex = daySlots.findIndex(slot => slot.id === updatedSlot.id);
        
        if (slotIndex !== -1) {
          const updatedDaySlots = [...daySlots];
          updatedDaySlots[slotIndex] = updatedSlot;
          updatedSchedule[updatedSlot.dayOfWeek] = updatedDaySlots;
        } else {
          updatedSchedule[updatedSlot.dayOfWeek] = [...daySlots, updatedSlot].sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
          );
        }
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          isAssigningStudent: false,
          selectedSlot: get().selectedSlot?.id === updatedSlot.id ? updatedSlot : get().selectedSlot,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isAssigningStudent: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to assign student:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בשיוך התלמיד למשבצת הזמן', 
        errorDetails: error,
        isAssigningStudent: false 
      });
      return null;
    }
  },
  
  removeStudent: async (scheduleSlotId: string) => {
    try {
      set({ isAssigningStudent: true, error: null });
      const updatedSlot = await scheduleService.removeStudentFromSlot(scheduleSlotId);
      
      // Update the teacher schedule with the updated slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        const daySlots = updatedSchedule[updatedSlot.dayOfWeek] || [];
        const slotIndex = daySlots.findIndex(slot => slot.id === updatedSlot.id);
        
        if (slotIndex !== -1) {
          const updatedDaySlots = [...daySlots];
          updatedDaySlots[slotIndex] = updatedSlot;
          updatedSchedule[updatedSlot.dayOfWeek] = updatedDaySlots;
        }
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          isAssigningStudent: false,
          selectedSlot: get().selectedSlot?.id === updatedSlot.id ? updatedSlot : get().selectedSlot,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isAssigningStudent: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to remove student:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בהסרת התלמיד ממשבצת הזמן', 
        errorDetails: error,
        isAssigningStudent: false 
      });
      return null;
    }
  },
  
  bulkAssignStudents: async (assignments: AssignStudentRequest[]) => {
    try {
      set({ isAssigningStudent: true, error: null });
      const updatedSlots = await scheduleService.bulkAssignStudents(assignments);
      
      // Update the teacher schedule with all updated slots
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        
        updatedSlots.forEach(updatedSlot => {
          const daySlots = updatedSchedule[updatedSlot.dayOfWeek] || [];
          const slotIndex = daySlots.findIndex(slot => slot.id === updatedSlot.id);
          
          if (slotIndex !== -1) {
            const updatedDaySlots = [...daySlots];
            updatedDaySlots[slotIndex] = updatedSlot;
            updatedSchedule[updatedSlot.dayOfWeek] = updatedDaySlots;
          } else {
            updatedSchedule[updatedSlot.dayOfWeek] = [...daySlots, updatedSlot].sort((a, b) => 
              a.startTime.localeCompare(b.startTime)
            );
          }
        });
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          isAssigningStudent: false,
          cacheTimestamp: Date.now(),
        });
      } else {
        set({ isAssigningStudent: false });
      }
      
      return updatedSlots;
    } catch (error) {
      console.error('Failed to bulk assign students:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בשיוך מרובה של תלמידים', 
        errorDetails: error,
        isAssigningStudent: false 
      });
      return [];
    }
  },
  
  loadStudentSchedule: async (studentId: string) => {
    try {
      set({ isLoadingStudentSchedule: true, error: null });
      const schedule = await scheduleService.getStudentSchedule(studentId);
      set({ currentStudentSchedule: schedule, isLoadingStudentSchedule: false });
    } catch (error) {
      console.error('Failed to load student schedule:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת מערכת השעות של התלמיד', 
        errorDetails: error,
        isLoadingStudentSchedule: false 
      });
    }
  },
  
  // Conflict Detection Actions
  checkScheduleConflicts: async (teacherId?: string) => {
    if (!teacherId) return;
    
    try {
      set({ isCheckingConflicts: true, error: null });
      const conflictingSlots = await scheduleService.getScheduleConflicts(teacherId);
      
      const conflicts: ScheduleConflict[] = conflictingSlots.map(slot => ({
        type: 'overlap',
        slotA: slot,
        message: 'משבצת זמן עם התנגשות',
        severity: 'error',
      }));
      
      set({ 
        conflicts,
        isCheckingConflicts: false,
        lastConflictCheck: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to check schedule conflicts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בבדיקת התנגשויות', 
        errorDetails: error,
        isCheckingConflicts: false 
      });
    }
  },
  
  resolveConflict: async (conflictId: string) => {
    // Implementation depends on conflict resolution strategy
    console.log('Resolving conflict:', conflictId);
  },
  
  // Search and Filter Actions
  searchScheduleSlots: async (filters: ScheduleFilters) => {
    try {
      const slots = await scheduleService.searchScheduleSlots(filters);
      return slots;
    } catch (error) {
      console.error('Failed to search schedule slots:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בחיפוש משבצות זמן', 
        errorDetails: error,
      });
      return [];
    }
  },
  
  // UI Actions
  setSelectedSlot: (slot: ScheduleSlot | null) => {
    set({ selectedSlot: slot });
  },
  
  clearErrors: () => {
    set({ error: null, errorDetails: null });
  },
  
  clearCache: () => {
    set({ cacheTimestamp: 0 });
  },
  
  resetState: () => {
    set({
      currentTeacherSchedule: null,
      currentTeacherScheduleMetadata: null,
      availableSlots: [],
      selectedSlot: null,
      currentStudentSchedule: null,
      conflicts: [],
      lastConflictCheck: null,
      isLoadingTeacherSchedule: false,
      isLoadingStudentSchedule: false,
      isLoadingAvailableSlots: false,
      isCreatingSlot: false,
      isUpdatingSlot: false,
      isAssigningStudent: false,
      isCheckingConflicts: false,
      error: null,
      errorDetails: null,
      cacheTimestamp: 0,
      // Reset time block system state
      teacherTimeBlocks: {},
      selectedTimeBlock: null,
      timeBlockStats: {},
      availableTimeSlots: [],
      slotSearchCriteria: null,
      lastSearchResults: null,
      activeAssignments: [],
      assignmentConflicts: [],
      recentAssignmentHistory: [],
      selectedDuration: 60,
      selectedDay: null,
      isCreatingTimeBlock: false,
      isCalculatingSlots: false,
      isAssigningLesson: false,
      viewMode: 'blocks',
      lastUpdated: {},
      pendingOperations: [],
    });
  },
  
  // Utility Actions
  getAvailableSlots: async (teacherId: string, filters?: Partial<GetAvailableSlotsRequest>) => {
    return get().loadAvailableSlots(teacherId, filters);
  },
  
  isSlotConflicting: (slot: ScheduleSlot) => {
    const conflicts = get().conflicts;
    return conflicts.some(conflict => 
      (typeof conflict.slotA === 'string' ? conflict.slotA === slot.id : conflict.slotA.id === slot.id) || 
      (conflict.slotB && (typeof conflict.slotB === 'string' ? conflict.slotB === slot.id : conflict.slotB.id === slot.id))
    );
  },
  
  getTeacherScheduleStats: async (teacherId: string) => {
    try {
      const stats = await scheduleService.getTeacherScheduleStats(teacherId);
      return stats;
    } catch (error) {
      console.error('Failed to get teacher schedule stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת סטטיסטיקות', 
        errorDetails: error,
      });
      return null;
    }
  },

  // ========================================
  // NEW TIME BLOCK SYSTEM ACTIONS
  // ========================================

  // Time Block Management Actions
  createTimeBlock: async (teacherId: string, timeBlockData: CreateTimeBlockRequest) => {
    try {
      set({ isCreatingTimeBlock: true, error: null });
      
      const newTimeBlock = await timeBlockService.createTimeBlock(teacherId, timeBlockData);
      
      // Update the teacher time blocks cache
      const currentBlocks = get().teacherTimeBlocks[teacherId] || [];
      const updatedBlocks = [...currentBlocks, newTimeBlock].sort((a, b) => {
        // Sort by day and then by start time
        const dayOrder = Object.keys(HEBREW_TO_NUMERIC_DAYS);
        const dayA = dayOrder.indexOf(a.day);
        const dayB = dayOrder.indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.startTime.localeCompare(b.startTime);
      });
      
      set({ 
        teacherTimeBlocks: {
          ...get().teacherTimeBlocks,
          [teacherId]: updatedBlocks
        },
        isCreatingTimeBlock: false,
        lastUpdated: {
          ...get().lastUpdated,
          [teacherId]: new Date()
        }
      });
      
      return newTimeBlock;
    } catch (error) {
      console.error('Failed to create time block:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה ביצירת יום לימוד חדש', 
        errorDetails: error,
        isCreatingTimeBlock: false 
      });
      return null;
    }
  },

  updateTimeBlock: async (timeBlockId: string, updateData: Partial<TimeBlockFormData>) => {
    try {
      set({ isCreatingTimeBlock: true, error: null });
      
      const updatedTimeBlock = await timeBlockService.updateTimeBlock(timeBlockId, updateData);
      
      // Update the time block in the cache
      const allBlocks = get().teacherTimeBlocks;
      const teacherId = updatedTimeBlock.teacherId;
      const currentBlocks = allBlocks[teacherId] || [];
      const updatedBlocks = currentBlocks.map(block => 
        block._id === timeBlockId ? updatedTimeBlock : block
      );
      
      set({ 
        teacherTimeBlocks: {
          ...allBlocks,
          [teacherId]: updatedBlocks
        },
        selectedTimeBlock: get().selectedTimeBlock?._id === timeBlockId ? updatedTimeBlock : get().selectedTimeBlock,
        isCreatingTimeBlock: false,
        lastUpdated: {
          ...get().lastUpdated,
          [teacherId]: new Date()
        }
      });
      
      return updatedTimeBlock;
    } catch (error) {
      console.error('Failed to update time block:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בעדכון יום הלימוד', 
        errorDetails: error,
        isCreatingTimeBlock: false 
      });
      return null;
    }
  },

  deleteTimeBlock: async (timeBlockId: string) => {
    try {
      set({ isCreatingTimeBlock: true, error: null });
      
      const result = await timeBlockService.deleteTimeBlock(timeBlockId);
      
      if (result.success) {
        // Remove the time block from all teacher caches
        const allBlocks = get().teacherTimeBlocks;
        const updatedBlocks: Record<string, TimeBlock[]> = {};
        
        Object.keys(allBlocks).forEach(teacherId => {
          updatedBlocks[teacherId] = allBlocks[teacherId].filter(block => block._id !== timeBlockId);
        });
        
        set({ 
          teacherTimeBlocks: updatedBlocks,
          selectedTimeBlock: get().selectedTimeBlock?._id === timeBlockId ? null : get().selectedTimeBlock,
          isCreatingTimeBlock: false,
        });
      }
      
      return result.success;
    } catch (error) {
      console.error('Failed to delete time block:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה במחיקת יום הלימוד', 
        errorDetails: error,
        isCreatingTimeBlock: false 
      });
      return false;
    }
  },

  loadTeacherTimeBlocks: async (teacherId: string, includeStats = true) => {
    try {
      set({ isLoadingTeacherSchedule: true, error: null });
      
      const response = await timeBlockService.getTeacherTimeBlocks(teacherId, includeStats);
      
      set({ 
        teacherTimeBlocks: {
          ...get().teacherTimeBlocks,
          [teacherId]: response.timeBlocks
        },
        timeBlockStats: includeStats && response.stats ? {
          ...get().timeBlockStats,
          [teacherId]: response.stats
        } : get().timeBlockStats,
        isLoadingTeacherSchedule: false,
        lastUpdated: {
          ...get().lastUpdated,
          [teacherId]: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to load teacher time blocks:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בטעינת ימי הלימוד של המורה', 
        errorDetails: error,
        isLoadingTeacherSchedule: false 
      });
    }
  },

  // Enhanced Slot Discovery Actions
  searchAvailableSlots: async (criteria: {
    teacherId: string;
    duration: LessonDurationMinutes;
    preferredDays?: HebrewDayName[];
    preferredTimeRange?: { startTime: string; endTime: string };
  }) => {
    try {
      set({ isCalculatingSlots: true, error: null });
      
      const searchCriteria: SlotSearchCriteria = {
        ...criteria,
        sortBy: 'optimal'
      };
      
      const response = await timeBlockService.getAvailableSlotsEnhanced(searchCriteria);
      
      set({ 
        availableTimeSlots: response.slots,
        slotSearchCriteria: criteria,
        lastSearchResults: response,
        isCalculatingSlots: false,
      });
      
      return response.slots;
    } catch (error) {
      console.error('Failed to search available slots:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בחיפוש השעות הזמינות', 
        errorDetails: error,
        isCalculatingSlots: false 
      });
      return [];
    }
  },

  // Intelligent Assignment Actions
  assignLessonToTimeBlock: async (assignmentData: {
    timeBlockId: string;
    studentId: string;
    lessonStartTime: string;
    duration: LessonDurationMinutes;
  }) => {
    try {
      set({ isAssigningLesson: true, error: null });
      
      const request: AssignLessonRequest = {
        timeBlockId: assignmentData.timeBlockId,
        studentId: assignmentData.studentId,
        lessonStartTime: assignmentData.lessonStartTime,
        duration: assignmentData.duration
      };
      
      const response = await timeBlockService.assignLessonToSlot(request);
      
      if (response.success) {
        // Update the time block in the cache
        const allBlocks = get().teacherTimeBlocks;
        const teacherId = response.updatedTimeBlock.teacherId;
        const currentBlocks = allBlocks[teacherId] || [];
        const updatedBlocks = currentBlocks.map(block => 
          block._id === assignmentData.timeBlockId ? response.updatedTimeBlock : block
        );
        
        // Add to assignment history
        const recentHistory = get().recentAssignmentHistory;
        const updatedHistory = [response.assignment, ...recentHistory.slice(0, 9)]; // Keep last 10
        
        set({ 
          teacherTimeBlocks: {
            ...allBlocks,
            [teacherId]: updatedBlocks
          },
          activeAssignments: [...get().activeAssignments, response.assignment],
          recentAssignmentHistory: updatedHistory,
          isAssigningLesson: false,
          lastUpdated: {
            ...get().lastUpdated,
            [teacherId]: new Date()
          }
        });
        
        return response.assignment;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to assign lesson to time block:', error);
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה בשיוך השיעור ליום הלימוד', 
        errorDetails: error,
        isAssigningLesson: false 
      });
      return null;
    }
  },

  // UI State Management Actions
  setSelectedTimeBlock: (timeBlock: TimeBlock | null) => {
    set({ selectedTimeBlock: timeBlock });
  },

  setSelectedDuration: (duration: LessonDurationMinutes) => {
    set({ selectedDuration: duration });
  },

  setSelectedDay: (day: HebrewDayName | null) => {
    set({ selectedDay: day });
  },

  setViewMode: (mode: 'blocks' | 'timeline' | 'calendar') => {
    set({ viewMode: mode });
  },
}));

export default useScheduleStore;