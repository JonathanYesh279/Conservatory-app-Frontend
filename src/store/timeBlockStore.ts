import { create } from 'zustand';
import timeBlockService, {
  TimeBlockResponse,
  LessonAssignment,
  AvailableSlot,
  TimeBlockRequest,
  AssignLessonRequest,
  SlotSearchCriteria,
  TeacherScheduleWithBlocks,
  LessonDurationMinutes,
  HebrewDayName,
} from '../services/timeBlockService';

interface TimeBlockState {
  // State
  currentTeacherSchedule: TeacherScheduleWithBlocks | null;
  teacherTimeBlocks: Record<string, TimeBlockResponse[]>;
  availableSlots: AvailableSlot[];
  recommendedSlots: AvailableSlot[];
  selectedTimeBlock: TimeBlockResponse | null;
  isLoading: boolean;
  isCalculatingSlots: boolean;
  error: string | null;
  lastSearchResults: any;

  // Computed properties
  totalAvailableSlots: number;
  currentUtilization: number;

  // Actions - Time Block Management
  createTimeBlock: (teacherId: string, timeBlockData: TimeBlockRequest) => Promise<TimeBlockResponse | null>;
  updateTimeBlock: (timeBlockId: string, updateData: Partial<TimeBlockRequest>) => Promise<TimeBlockResponse | null>;
  deleteTimeBlock: (timeBlockId: string) => Promise<boolean>;
  loadTeacherSchedule: (teacherId: string) => Promise<void>;
  loadTeacherTimeBlocks: (teacherId: string) => Promise<void>;

  // Actions - Slot Discovery
  findAvailableSlots: (teacherId: string, criteria: SlotSearchCriteria) => Promise<void>;
  refreshAvailableSlots: (teacherId: string, duration: LessonDurationMinutes) => Promise<void>;

  // Actions - Lesson Assignment
  assignLesson: (assignmentData: AssignLessonRequest) => Promise<LessonAssignment | null>;
  cancelLessonAssignment: (assignmentId: string) => Promise<boolean>;

  // Utility actions
  clearError: () => void;
  setSelectedTimeBlock: (timeBlock: TimeBlockResponse | null) => void;
  
  // Client-side calculations
  calculateDynamicAvailability: (duration: LessonDurationMinutes) => AvailableSlot[];
}

export const useTimeBlockStore = create<TimeBlockState>((set, get) => ({
  // Initial state
  currentTeacherSchedule: null,
  teacherTimeBlocks: {},
  availableSlots: [],
  recommendedSlots: [],
  selectedTimeBlock: null,
  isLoading: false,
  isCalculatingSlots: false,
  error: null,
  lastSearchResults: null,

  // Computed properties
  get totalAvailableSlots() {
    return get().availableSlots.length;
  },

  get currentUtilization() {
    const schedule = get().currentTeacherSchedule;
    return schedule?.weeklyStats?.utilizationPercentage || 0;
  },

  // Time Block Management Actions
  createTimeBlock: async (teacherId: string, timeBlockData: TimeBlockRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newTimeBlock = await timeBlockService.createTimeBlock(teacherId, timeBlockData);
      
      // Refresh the teacher schedule to include the new time block
      await get().loadTeacherSchedule(teacherId);
      
      set({ isLoading: false });
      return newTimeBlock;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה ביצירת יום לימוד';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateTimeBlock: async (timeBlockId: string, updateData: Partial<TimeBlockRequest>) => {
    set({ isLoading: true, error: null });
    try {
      const result = await timeBlockService.updateTimeBlock(timeBlockId, updateData);
      
      if (result.success) {
        // Update the local state
        const currentSchedule = get().currentTeacherSchedule;
        if (currentSchedule) {
          const updatedTimeBlocks = currentSchedule.timeBlocks.map(block =>
            block._id === timeBlockId ? result.updatedTimeBlock : block
          );
          
          set({
            currentTeacherSchedule: {
              ...currentSchedule,
              timeBlocks: updatedTimeBlocks
            },
            isLoading: false
          });
        }
        
        return result.updatedTimeBlock;
      } else {
        throw new Error(result.message || 'שגיאה בעדכון יום הלימוד');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון יום לימוד';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteTimeBlock: async (timeBlockId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await timeBlockService.deleteTimeBlock(timeBlockId);
      
      if (result.success) {
        // Remove from local state
        const currentSchedule = get().currentTeacherSchedule;
        if (currentSchedule) {
          const updatedTimeBlocks = currentSchedule.timeBlocks.filter(
            block => block._id !== timeBlockId
          );
          
          set({
            currentTeacherSchedule: {
              ...currentSchedule,
              timeBlocks: updatedTimeBlocks
            },
            selectedTimeBlock: get().selectedTimeBlock?._id === timeBlockId ? null : get().selectedTimeBlock,
            isLoading: false
          });
        }
        
        return true;
      } else {
        throw new Error(result.message || 'שגיאה במחיקת יום הלימוד');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה במחיקת יום לימוד';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  loadTeacherSchedule: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const schedule = await timeBlockService.getTeacherScheduleWithBlocks(teacherId);
      set({
        currentTeacherSchedule: schedule,
        isLoading: false
      });
    } catch (error) {
      console.warn('Failed to load teacher schedule, continuing without conflict detection:', error);
      // Don't set error for this - just continue without schedule data
      // This allows time block creation to work even if schedule loading fails
      set({ 
        currentTeacherSchedule: null,
        isLoading: false 
      });
    }
  },

  loadTeacherTimeBlocks: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const timeBlocks = await timeBlockService.getTeacherTimeBlocks(teacherId);
      set(state => ({
        teacherTimeBlocks: {
          ...state.teacherTimeBlocks,
          [teacherId]: timeBlocks
        },
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בטעינת ימי לימוד';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Slot Discovery Actions
  findAvailableSlots: async (teacherId: string, criteria: SlotSearchCriteria) => {
    set({ isLoading: true, error: null });
    try {
      console.log('timeBlockStore - findAvailableSlots called with criteria:', criteria);
      console.log('timeBlockStore - criteria keys:', Object.keys(criteria));
      if ('schoolYearId' in criteria) {
        console.error('CONTAMINATION DETECTED in timeBlockStore - criteria contains schoolYearId:', criteria);
        console.trace();
      }
      const slotsResponse = await timeBlockService.getAvailableSlots(teacherId, criteria);
      
      set({
        availableSlots: slotsResponse.availableSlots || [],
        recommendedSlots: slotsResponse.recommendedSlots || [],
        isLoading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בחיפוש שעות זמינות';
      set({ error: errorMessage, isLoading: false });
    }
  },

  refreshAvailableSlots: async (teacherId: string, duration: LessonDurationMinutes) => {
    const criteria: SlotSearchCriteria = { duration };
    await get().findAvailableSlots(teacherId, criteria);
  },

  // Lesson Assignment Actions
  assignLesson: async (assignmentData: AssignLessonRequest) => {
    set({ isLoading: true, error: null });
    try {
      const result = await timeBlockService.assignLesson(assignmentData);
      
      if (result.success) {
        // Update the time block in local state
        const currentSchedule = get().currentTeacherSchedule;
        if (currentSchedule) {
          const updatedTimeBlocks = currentSchedule.timeBlocks.map(block =>
            block._id === result.updatedTimeBlock._id ? result.updatedTimeBlock : block
          );
          
          set({
            currentTeacherSchedule: {
              ...currentSchedule,
              timeBlocks: updatedTimeBlocks
            },
            availableSlots: result.newAvailableSlots,
            isLoading: false
          });
        }
        
        return result.assignment;
      } else {
        throw new Error(result.message || 'שגיאה בהקצאת השיעור');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהקצאת השיעור';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  cancelLessonAssignment: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await timeBlockService.cancelLessonAssignment(assignmentId);
      
      if (result.success) {
        // Update the time block in local state
        const currentSchedule = get().currentTeacherSchedule;
        if (currentSchedule) {
          const updatedTimeBlocks = currentSchedule.timeBlocks.map(block =>
            block._id === result.updatedTimeBlock._id ? result.updatedTimeBlock : block
          );
          
          set({
            currentTeacherSchedule: {
              ...currentSchedule,
              timeBlocks: updatedTimeBlocks
            },
            availableSlots: result.newAvailableSlots,
            isLoading: false
          });
        }
        
        return true;
      } else {
        throw new Error(result.message || 'שגיאה בביטול השיעור');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בביטול השיעור';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // Utility Actions
  clearError: () => set({ error: null }),

  setSelectedTimeBlock: (timeBlock: TimeBlockResponse | null) => 
    set({ selectedTimeBlock: timeBlock }),

  // Client-side calculations for immediate feedback
  calculateDynamicAvailability: (duration: LessonDurationMinutes) => {
    const schedule = get().currentTeacherSchedule;
    if (!schedule || !schedule.timeBlocks) return [];

    return timeBlockService.calculateDynamicAvailability(schedule.timeBlocks, duration);
  },
}));

export default useTimeBlockStore;