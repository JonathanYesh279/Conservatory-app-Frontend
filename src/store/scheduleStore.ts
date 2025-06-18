import { create } from 'zustand';
import { 
  scheduleService, 
  ScheduleSlot, 
  WeeklySchedule, 
  StudentSchedule,
  CreateScheduleSlotData,
  AssignStudentData,
  UpdateScheduleSlotData,
  AvailableSlotsFilter
} from '../services/scheduleService';
import { findScheduleConflicts } from '../utils/scheduleUtils';

interface ScheduleState {
  // Teacher schedule data
  currentTeacherSchedule: WeeklySchedule | null;
  availableSlots: ScheduleSlot[];
  selectedSlot: ScheduleSlot | null;
  
  // Student schedule data
  currentStudentSchedule: StudentSchedule | null;
  
  // UI states
  isLoadingTeacherSchedule: boolean;
  isLoadingStudentSchedule: boolean;
  isLoadingAvailableSlots: boolean;
  isCreatingSlot: boolean;
  isUpdatingSlot: boolean;
  isAssigningStudent: boolean;
  
  // Errors
  error: string | null;
  
  // Schedule conflicts
  conflicts: { slotA: string, slotB: string }[];
  
  // Actions - Teacher Schedule
  loadTeacherSchedule: (teacherId: string, includeStudentInfo?: boolean) => Promise<void>;
  loadAvailableSlots: (teacherId: string, filters?: AvailableSlotsFilter) => Promise<void>;
  createTimeSlot: (teacherId: string, slotData: CreateScheduleSlotData) => Promise<ScheduleSlot | null>;
  updateTimeSlot: (scheduleSlotId: string, updateData: UpdateScheduleSlotData) => Promise<ScheduleSlot | null>;
  deleteTimeSlot: (scheduleSlotId: string) => Promise<boolean>;
  
  // Actions - Student Assignment
  assignStudent: (assignmentData: AssignStudentData) => Promise<ScheduleSlot | null>;
  removeStudent: (scheduleSlotId: string) => Promise<ScheduleSlot | null>;
  loadStudentSchedule: (studentId: string) => Promise<void>;
  
  // UI Actions
  setSelectedSlot: (slot: ScheduleSlot | null) => void;
  clearErrors: () => void;
  resetState: () => void;
}

// Helper function to extract all slots from a weekly schedule
const extractAllSlots = (weeklySchedule: WeeklySchedule): ScheduleSlot[] => {
  if (!weeklySchedule) return [];
  
  const allSlots: ScheduleSlot[] = [];
  Object.values(weeklySchedule).forEach(daySlots => {
    allSlots.push(...daySlots);
  });
  
  return allSlots;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state
  currentTeacherSchedule: null,
  availableSlots: [],
  selectedSlot: null,
  currentStudentSchedule: null,
  isLoadingTeacherSchedule: false,
  isLoadingStudentSchedule: false,
  isLoadingAvailableSlots: false,
  isCreatingSlot: false,
  isUpdatingSlot: false,
  isAssigningStudent: false,
  error: null,
  conflicts: [],
  
  // Teacher Schedule Actions
  loadTeacherSchedule: async (teacherId: string, includeStudentInfo = true) => {
    try {
      set({ isLoadingTeacherSchedule: true, error: null });
      const schedule = await scheduleService.getTeacherWeeklySchedule(teacherId, includeStudentInfo);
      
      // Calculate conflicts
      const allSlots = extractAllSlots(schedule);
      const conflicts = findScheduleConflicts(allSlots);
      
      set({ 
        currentTeacherSchedule: schedule, 
        isLoadingTeacherSchedule: false,
        conflicts
      });
    } catch (error) {
      console.error('Failed to load teacher schedule:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load teacher schedule', 
        isLoadingTeacherSchedule: false 
      });
    }
  },
  
  loadAvailableSlots: async (teacherId: string, filters?: AvailableSlotsFilter) => {
    try {
      set({ isLoadingAvailableSlots: true, error: null });
      const slots = await scheduleService.getAvailableSlots(teacherId, filters);
      set({ availableSlots: slots, isLoadingAvailableSlots: false });
    } catch (error) {
      console.error('Failed to load available slots:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load available slots', 
        isLoadingAvailableSlots: false 
      });
    }
  },
  
  createTimeSlot: async (teacherId: string, slotData: CreateScheduleSlotData) => {
    try {
      set({ isCreatingSlot: true, error: null });
      const newSlot = await scheduleService.createScheduleSlot(teacherId, slotData);
      
      // Update the teacher schedule with the new slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        const updatedSchedule = { ...currentSchedule };
        const daySlots = updatedSchedule[newSlot.dayOfWeek] || [];
        updatedSchedule[newSlot.dayOfWeek] = [...daySlots, newSlot];
        
        // Recalculate conflicts
        const allSlots = extractAllSlots(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts,
          isCreatingSlot: false 
        });
      } else {
        set({ isCreatingSlot: false });
      }
      
      return newSlot;
    } catch (error) {
      console.error('Failed to create time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create time slot', 
        isCreatingSlot: false 
      });
      return null;
    }
  },
  
  updateTimeSlot: async (scheduleSlotId: string, updateData: UpdateScheduleSlotData) => {
    try {
      set({ isUpdatingSlot: true, error: null });
      const updatedSlot = await scheduleService.updateScheduleSlot(scheduleSlotId, updateData);
      
      // Update the teacher schedule with the updated slot
      const currentSchedule = get().currentTeacherSchedule;
      if (currentSchedule) {
        // We need to handle if the day changed
        const updatedSchedule = { ...currentSchedule };
        
        // Remove the slot from its original day if present
        Object.keys(updatedSchedule).forEach(dayKey => {
          const day = Number(dayKey);
          updatedSchedule[day] = updatedSchedule[day].filter(slot => slot.id !== scheduleSlotId);
        });
        
        // Add the updated slot to the correct day
        const daySlots = updatedSchedule[updatedSlot.dayOfWeek] || [];
        updatedSchedule[updatedSlot.dayOfWeek] = [...daySlots, updatedSlot];
        
        // Recalculate conflicts
        const allSlots = extractAllSlots(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts,
          isUpdatingSlot: false,
          // Update selected slot if it was the one updated
          selectedSlot: get().selectedSlot?.id === scheduleSlotId ? updatedSlot : get().selectedSlot
        });
      } else {
        set({ isUpdatingSlot: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to update time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update time slot', 
        isUpdatingSlot: false 
      });
      return null;
    }
  },
  
  deleteTimeSlot: async (scheduleSlotId: string) => {
    try {
      set({ isUpdatingSlot: true, error: null });
      // Assuming the API endpoint for deletion
      await scheduleService.updateScheduleSlot(scheduleSlotId, { isRecurring: false });
      
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
        const allSlots = extractAllSlots(updatedSchedule);
        const conflicts = findScheduleConflicts(allSlots);
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          conflicts,
          isUpdatingSlot: false,
          // Clear selected slot if it was the one deleted
          selectedSlot: get().selectedSlot?.id === scheduleSlotId ? null : get().selectedSlot
        });
      } else {
        set({ isUpdatingSlot: false });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete time slot:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete time slot', 
        isUpdatingSlot: false 
      });
      return false;
    }
  },
  
  // Student Assignment Actions
  assignStudent: async (assignmentData: AssignStudentData) => {
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
          // Replace the slot
          const updatedDaySlots = [...daySlots];
          updatedDaySlots[slotIndex] = updatedSlot;
          updatedSchedule[updatedSlot.dayOfWeek] = updatedDaySlots;
        } else {
          // Add the slot if not found
          updatedSchedule[updatedSlot.dayOfWeek] = [...daySlots, updatedSlot];
        }
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          isAssigningStudent: false,
          // Update selected slot if it was the one updated
          selectedSlot: get().selectedSlot?.id === updatedSlot.id ? updatedSlot : get().selectedSlot
        });
      } else {
        set({ isAssigningStudent: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to assign student:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to assign student', 
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
          // Replace the slot
          const updatedDaySlots = [...daySlots];
          updatedDaySlots[slotIndex] = updatedSlot;
          updatedSchedule[updatedSlot.dayOfWeek] = updatedDaySlots;
        }
        
        set({ 
          currentTeacherSchedule: updatedSchedule,
          isAssigningStudent: false,
          // Update selected slot if it was the one updated
          selectedSlot: get().selectedSlot?.id === updatedSlot.id ? updatedSlot : get().selectedSlot
        });
      } else {
        set({ isAssigningStudent: false });
      }
      
      return updatedSlot;
    } catch (error) {
      console.error('Failed to remove student:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove student', 
        isAssigningStudent: false 
      });
      return null;
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
        error: error instanceof Error ? error.message : 'Failed to load student schedule', 
        isLoadingStudentSchedule: false 
      });
    }
  },
  
  // UI Actions
  setSelectedSlot: (slot: ScheduleSlot | null) => {
    set({ selectedSlot: slot });
  },
  
  clearErrors: () => {
    set({ error: null });
  },
  
  resetState: () => {
    set({
      currentTeacherSchedule: null,
      availableSlots: [],
      selectedSlot: null,
      currentStudentSchedule: null,
      isLoadingTeacherSchedule: false,
      isLoadingStudentSchedule: false,
      isLoadingAvailableSlots: false,
      isCreatingSlot: false,
      isUpdatingSlot: false,
      isAssigningStudent: false,
      error: null,
      conflicts: []
    });
  }
}));

export default useScheduleStore;