import { useState, useEffect, useCallback } from 'react';
import { 
  ScheduleSlot, 
  CreateScheduleSlotRequest as CreateScheduleSlotData, 
  UpdateScheduleSlotRequest as UpdateScheduleSlotData,
  GetAvailableSlotsRequest as AvailableSlotsFilter,
  ScheduleConflict
} from '../types/schedule';
import { useScheduleStore } from '../store/scheduleStore';
import { validateSlotConflicts } from '../utils/scheduleValidation';
import { groupSlotsByDay, sortScheduleSlots } from '../utils/scheduleUtils';

interface UseScheduleManagementProps {
  teacherId?: string;
  autoLoad?: boolean;
}

interface UseScheduleManagementReturn {
  // Data
  weeklySchedule: { [dayOfWeek: number]: ScheduleSlot[] } | null;
  availableSlots: ScheduleSlot[];
  selectedSlot: ScheduleSlot | null;
  conflicts: ScheduleConflict[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  loadTeacherSchedule: (teacherId: string, includeStudentInfo?: boolean) => Promise<void>;
  loadAvailableSlots: (teacherId: string, filters?: AvailableSlotsFilter) => Promise<void>;
  createTimeSlot: (slotData: CreateScheduleSlotData) => Promise<ScheduleSlot | null>;
  updateTimeSlot: (scheduleSlotId: string, updateData: UpdateScheduleSlotData) => Promise<ScheduleSlot | null>;
  deleteTimeSlot: (scheduleSlotId: string) => Promise<boolean>;
  selectSlot: (slot: ScheduleSlot | null) => void;
  checkForConflicts: (newSlot: Partial<ScheduleSlot>) => string | null;
  clearErrors: () => void;
}

const useScheduleManagement = ({
  teacherId,
  autoLoad = false
}: UseScheduleManagementProps = {}): UseScheduleManagementReturn => {
  // Get store state and actions
  const {
    currentTeacherSchedule,
    availableSlots,
    selectedSlot,
    conflicts,
    isLoadingTeacherSchedule,
    isCreatingSlot,
    isUpdatingSlot,
    error,
    loadTeacherSchedule: storeLoadTeacherSchedule,
    loadAvailableSlots: storeLoadAvailableSlots,
    createTimeSlot: storeCreateTimeSlot,
    updateTimeSlot: storeUpdateTimeSlot,
    deleteTimeSlot: storeDeleteTimeSlot,
    setSelectedSlot,
    clearErrors: storeClearErrors
  } = useScheduleStore();
  
  // Additional loading state for initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Auto-load teacher schedule if teacherId is provided and autoLoad is true
  useEffect(() => {
    if (teacherId && autoLoad && isInitialLoad) {
      storeLoadTeacherSchedule(teacherId);
      setIsInitialLoad(false);
    }
  }, [teacherId, autoLoad, isInitialLoad, storeLoadTeacherSchedule]);
  
  // Helper function to get all slots from the current schedule
  const getAllSlots = useCallback((): ScheduleSlot[] => {
    if (!currentTeacherSchedule) return [];
    
    const allSlots: ScheduleSlot[] = [];
    Object.values(currentTeacherSchedule).forEach(daySlots => {
      allSlots.push(...daySlots);
    });
    
    return allSlots;
  }, [currentTeacherSchedule]);
  
  // Load teacher schedule with teacherId
  const loadTeacherSchedule = useCallback(
    async (id: string, includeStudentInfo = true) => {
      await storeLoadTeacherSchedule(id, includeStudentInfo);
    },
    [storeLoadTeacherSchedule]
  );
  
  // Load available slots with teacherId and filters
  const loadAvailableSlots = useCallback(
    async (id: string, filters?: AvailableSlotsFilter) => {
      await storeLoadAvailableSlots(id, filters);
    },
    [storeLoadAvailableSlots]
  );
  
  // Create a new time slot
  const createTimeSlot = useCallback(
    async (slotData: CreateScheduleSlotData) => {
      if (!teacherId) {
        console.error('Teacher ID is required to create a time slot');
        return null;
      }
      
      return await storeCreateTimeSlot(teacherId, slotData);
    },
    [teacherId, storeCreateTimeSlot]
  );
  
  // Update an existing time slot
  const updateTimeSlot = useCallback(
    async (scheduleSlotId: string, updateData: UpdateScheduleSlotData) => {
      return await storeUpdateTimeSlot(scheduleSlotId, updateData);
    },
    [storeUpdateTimeSlot]
  );
  
  // Delete a time slot
  const deleteTimeSlot = useCallback(
    async (scheduleSlotId: string) => {
      return await storeDeleteTimeSlot(scheduleSlotId);
    },
    [storeDeleteTimeSlot]
  );
  
  // Select a slot
  const selectSlot = useCallback(
    (slot: ScheduleSlot | null) => {
      setSelectedSlot(slot);
    },
    [setSelectedSlot]
  );
  
  // Check for conflicts with existing slots
  const checkForConflicts = useCallback(
    (newSlot: Partial<ScheduleSlot>): string | null => {
      const existingSlots = getAllSlots();
      return validateSlotConflicts(newSlot, existingSlots);
    },
    [getAllSlots]
  );
  
  // Clear errors
  const clearErrors = useCallback(() => {
    storeClearErrors();
  }, [storeClearErrors]);
  
  // Calculate the combined loading state
  const isLoading = isLoadingTeacherSchedule;
  
  // Return the data and actions
  return {
    weeklySchedule: currentTeacherSchedule,
    availableSlots,
    selectedSlot,
    conflicts,
    isLoading,
    isCreating: isCreatingSlot,
    isUpdating: isUpdatingSlot,
    error,
    loadTeacherSchedule,
    loadAvailableSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    selectSlot,
    checkForConflicts,
    clearErrors
  };
};

export { useScheduleManagement };