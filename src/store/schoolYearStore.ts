// src/store/schoolYearStore.ts
import { create } from 'zustand';
import { httpService } from '../services/httpService';

export interface SchoolYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolYearState {
  schoolYears: SchoolYear[];
  currentSchoolYear: SchoolYear | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSchoolYears: () => Promise<SchoolYear[]>;
  loadCurrentSchoolYear: () => Promise<SchoolYear | null>;
  fetchCurrentSchoolYear: () => Promise<SchoolYear | null>;
}

export const useSchoolYearStore = create<SchoolYearState>((set, get) => ({
  schoolYears: [],
  currentSchoolYear: null,
  isLoading: false,
  error: null,

  loadSchoolYears: async () => {
    set({ isLoading: true, error: null });
    try {
      const schoolYears = await httpService.get<SchoolYear[]>('school-year');
      set({ schoolYears, isLoading: false });
      return schoolYears;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load school years';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading school years:', err);
      return [];
    }
  },

  loadCurrentSchoolYear: async () => {
    // Check if we already have a current school year loaded
    if (get().currentSchoolYear?._id) {
      console.log('Using cached school year:', get().currentSchoolYear);
      return get().currentSchoolYear;
    }

    // Otherwise fetch it
    return get().fetchCurrentSchoolYear();
  },

  // Separate method that always fetches from the server
  fetchCurrentSchoolYear: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching current school year from API...');
      const currentSchoolYear = await httpService.get<SchoolYear>(
        'school-year/current'
      );
      console.log('API returned school year:', currentSchoolYear);

      if (!currentSchoolYear || !currentSchoolYear._id) {
        throw new Error(
          'Failed to load current school year - API returned empty data'
        );
      }

      set({ currentSchoolYear, isLoading: false });
      return currentSchoolYear;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load current school year';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading current school year:', err);
      return null;
    }
  },
}));
