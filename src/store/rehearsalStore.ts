// src/store/rehearsalStore.ts
import { create } from 'zustand';
import {
  BulkRehearsalData,
  Rehearsal,
  RehearsalFilter,
  rehearsalService,
} from '../services/rehearsalService';
import { useSchoolYearStore } from './schoolYearStore';

interface RehearsalState {
  rehearsals: Rehearsal[];
  selectedRehearsal: Rehearsal | null;
  filterBy: RehearsalFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRehearsals: (filterBy?: RehearsalFilter) => Promise<void>;
  loadRehearsalById: (rehearsalId: string) => Promise<void>;
  loadRehearsalsByOrchestraId: (orchestraId: string) => Promise<void>;
  saveRehearsal: (rehearsal: Partial<Rehearsal>) => Promise<Rehearsal>;
  removeRehearsal: (rehearsalId: string) => Promise<void>;
  bulkCreateRehearsals: (data: BulkRehearsalData) => Promise<{
    insertedCount: number;
    rehearsalIds: string[];
  }>;
  updateAttendance: (
    rehearsalId: string,
    attendance: { present: string[]; absent: string[] }
  ) => Promise<void>;
  setFilter: (filterBy: Partial<RehearsalFilter>) => void;
  clearSelectedRehearsal: () => void;
  clearError: () => void;
}

export const useRehearsalStore = create<RehearsalState>((set, get) => ({
  rehearsals: [],
  selectedRehearsal: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadRehearsals: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const rehearsals = await rehearsalService.getRehearsals(filterBy);
      set({ rehearsals, filterBy, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load rehearsals';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading rehearsals:', err);
    }
  },

  loadRehearsalById: async (rehearsalId) => {
    set({ isLoading: true, error: null });
    try {
      const rehearsal = await rehearsalService.getRehearsalById(rehearsalId);
      set({ selectedRehearsal: rehearsal, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load rehearsal';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading rehearsal:', err);
    }
  },

  loadRehearsalsByOrchestraId: async (orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      const rehearsals = await rehearsalService.getRehearsalsByOrchestraId(
        orchestraId
      );
      set({ rehearsals, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load orchestra rehearsals';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading orchestra rehearsals:', err);
    }
  },

  saveRehearsal: async (rehearsalToSave) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure schoolYearId is present
      if (!rehearsalToSave.schoolYearId) {
        // Try to get it from the school year store
        const schoolYearStore = useSchoolYearStore.getState();
        const schoolYearId = schoolYearStore.currentSchoolYear?._id;

        if (!schoolYearId) {
          throw new Error('School year ID is required but not available');
        }

        rehearsalToSave.schoolYearId = schoolYearId;
      }

      let savedRehearsal: Rehearsal;

      if (rehearsalToSave._id) {
        // Update existing rehearsal
        savedRehearsal = await rehearsalService.updateRehearsal(
          rehearsalToSave._id,
          rehearsalToSave
        );

        // Update in the rehearsals array
        const updatedRehearsals = get().rehearsals.map((r) =>
          r._id === savedRehearsal._id ? savedRehearsal : r
        );

        set({
          rehearsals: updatedRehearsals,
          selectedRehearsal: savedRehearsal,
          isLoading: false,
        });
      } else {
        // Add new rehearsal
        console.log('Adding new rehearsal with data:', rehearsalToSave);
        savedRehearsal = await rehearsalService.addRehearsal(rehearsalToSave);

        set({
          rehearsals: [...get().rehearsals, savedRehearsal],
          selectedRehearsal: savedRehearsal,
          isLoading: false,
        });
      }

      return savedRehearsal;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save rehearsal';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving rehearsal:', err);
      throw err;
    }
  },

  removeRehearsal: async (rehearsalId) => {
    set({ isLoading: true, error: null });
    try {
      if (!rehearsalId) {
        throw new Error('Invalid rehearsal ID');
      }

      // Make the API call
      await rehearsalService.removeRehearsal(rehearsalId);

      // Update state only if API call succeeds
      set({
        rehearsals: get().rehearsals.filter((r) => r._id !== rehearsalId),
        selectedRehearsal:
          get().selectedRehearsal?._id === rehearsalId
            ? null
            : get().selectedRehearsal,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove rehearsal';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing rehearsal:', err);
      throw err;
    }
  },

  bulkCreateRehearsals: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure schoolYearId is present
      if (!data.schoolYearId) {
        // Try to get it from the school year store
        const schoolYearStore = useSchoolYearStore.getState();
        const schoolYearId = schoolYearStore.currentSchoolYear?._id;

        if (!schoolYearId) {
          throw new Error(
            'School year ID is required for bulk rehearsal creation but not available'
          );
        }

        data.schoolYearId = schoolYearId;
      }

      // Create a formatted object with all required fields
      const formattedData: BulkRehearsalData = {
        orchestraId: data.orchestraId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: Number(data.dayOfWeek),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        notes: data.notes || '',
        excludeDates: data.excludeDates || [],
        schoolYearId: data.schoolYearId, // Ensure schoolYearId is included
      };

      console.log('Sending bulk create data:', formattedData);

      // Execute API call
      const result = await rehearsalService.bulkCreateRehearsals(formattedData);

      // After bulk creating, refresh the rehearsal list
      if (formattedData.orchestraId) {
        await get().loadRehearsalsByOrchestraId(formattedData.orchestraId);
      } else {
        await get().loadRehearsals();
      }

      set({ isLoading: false });
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create bulk rehearsals';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating bulk rehearsals:', err);
      throw err;
    }
  },

  updateAttendance: async (rehearsalId, attendance) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRehearsal = await rehearsalService.updateAttendance(
        rehearsalId,
        attendance
      );

      // Update in the rehearsals array
      const updatedRehearsals = get().rehearsals.map((r) =>
        r._id === rehearsalId ? updatedRehearsal : r
      );

      set({
        rehearsals: updatedRehearsals,
        selectedRehearsal:
          get().selectedRehearsal?._id === rehearsalId
            ? updatedRehearsal
            : get().selectedRehearsal,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update attendance';
      set({ error: errorMessage, isLoading: false });
      console.error('Error updating attendance:', err);
      throw err;
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } });
  },

  clearSelectedRehearsal: () => {
    set({ selectedRehearsal: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
