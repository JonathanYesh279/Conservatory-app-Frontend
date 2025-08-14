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
<<<<<<< Updated upstream
  removeRehearsalsByOrchestra: (orchestraId: string) => Promise<{ deletedCount: number }>;
  updateRehearsalsByOrchestra: (orchestraId: string, updates: Partial<Rehearsal>) => Promise<{ updatedCount: number }>;
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  removeRehearsalsByOrchestra: async (orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      if (!orchestraId) {
        throw new Error('Invalid orchestra ID');
      }

      // Make the API call
      const result = await rehearsalService.removeRehearsalsByOrchestra(orchestraId);

      // Update state by filtering out all rehearsals for this orchestra
      set({
        rehearsals: get().rehearsals.filter((r) => r.groupId !== orchestraId),
        selectedRehearsal:
          get().selectedRehearsal?.groupId === orchestraId
            ? null
            : get().selectedRehearsal,
        isLoading: false,
      });
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove orchestra rehearsals';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing orchestra rehearsals:', err);
      throw err;
    }
  },

  updateRehearsalsByOrchestra: async (orchestraId, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!orchestraId) {
        throw new Error('Invalid orchestra ID');
      }

      // Remove fields that shouldn't be updated in bulk operations
      const { _id, createdAt, updatedAt, groupId, date, schoolYearId, ...safeUpdates } = updates as any;

      // Make the API call
      const result = await rehearsalService.updateRehearsalsByOrchestra(orchestraId, safeUpdates);

      // Refresh the rehearsals to get the updated data
      // We reload instead of trying to update locally to ensure data consistency
      await get().loadRehearsals(get().filterBy);

      set({ isLoading: false });
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update orchestra rehearsals';
      set({ error: errorMessage, isLoading: false });
      console.error('Error updating orchestra rehearsals:', err);
      throw err;
    }
  },

=======
>>>>>>> Stashed changes
  bulkCreateRehearsals: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Get the current school year if not provided
      if (!data.schoolYearId) {
        const schoolYearStore = useSchoolYearStore.getState();
        let schoolYearId = schoolYearStore.currentSchoolYear?._id;

        // If currentSchoolYear is not loaded yet, try to load it
        if (!schoolYearId) {
          console.log('Current school year not found, attempting to load...');
          try {
            await schoolYearStore.loadCurrentSchoolYear();
            schoolYearId = schoolYearStore.currentSchoolYear?._id;
          } catch (err) {
            console.error('Failed to load current school year:', err);
          }
        }

        if (!schoolYearId) {
          throw new Error(
            'School year ID is required for bulk rehearsal creation but not available'
          );
        }

        data.schoolYearId = schoolYearId;
      }

      console.log('Using school year ID for bulk create:', data.schoolYearId);

      // Validate required fields
      if (!data.orchestraId) {
        throw new Error('Orchestra ID is required for bulk rehearsal creation');
      }

      if (!data.startDate || !data.endDate) {
        throw new Error('Start date and end date are required');
      }

      if (data.dayOfWeek === undefined || data.dayOfWeek === null) {
        throw new Error('Day of week is required');
      }

      if (!data.startTime || !data.endTime) {
        throw new Error('Start time and end time are required');
      }

      if (!data.location) {
        throw new Error('Location is required');
      }

      // Convert dayOfWeek to number if it's a string
      const dayOfWeek =
        typeof data.dayOfWeek === 'string'
          ? parseInt(data.dayOfWeek, 10)
          : data.dayOfWeek;

      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('Day of week must be a number between 0 and 6');
      }

      // Create a formatted object with all required fields
      const formattedData: BulkRehearsalData = {
        orchestraId: data.orchestraId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        notes: data.notes || '',
        excludeDates: data.excludeDates || [],
        schoolYearId: data.schoolYearId,
      };

      console.log('Formatted data for bulk create:', formattedData);

      // Execute API call
      const result = await rehearsalService.bulkCreateRehearsals(formattedData);
      console.log('Bulk create result:', result);

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
