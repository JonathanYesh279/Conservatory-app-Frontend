// src/store/theoryStore.ts
import { create } from 'zustand';
import {
  BulkTheoryLessonData,
  TheoryLesson,
  TheoryFilter,
  theoryService,
} from '../services/theoryService';
import { useSchoolYearStore } from './schoolYearStore';

interface TheoryState {
  theoryLessons: TheoryLesson[];
  selectedTheoryLesson: TheoryLesson | null;
  filterBy: TheoryFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTheoryLessons: (filterBy?: TheoryFilter) => Promise<void>;
  loadTheoryLessonById: (theoryLessonId: string) => Promise<void>;
  loadTheoryLessonsByCategory: (category: string, filterBy?: TheoryFilter) => Promise<void>;
  loadTheoryLessonsByTeacher: (teacherId: string, filterBy?: TheoryFilter) => Promise<void>;
  saveTheoryLesson: (theoryLesson: Partial<TheoryLesson>) => Promise<TheoryLesson>;
  removeTheoryLesson: (theoryLessonId: string) => Promise<void>;
  bulkCreateTheoryLessons: (data: BulkTheoryLessonData) => Promise<{
    insertedCount: number;
    theoryLessonIds: string[];
  }>;
  updateAttendance: (
    theoryLessonId: string,
    attendance: { present: string[]; absent: string[] }
  ) => Promise<void>;
  addStudentToTheory: (theoryLessonId: string, studentId: string) => Promise<void>;
  removeStudentFromTheory: (theoryLessonId: string, studentId: string) => Promise<void>;
  setFilter: (filterBy: Partial<TheoryFilter>) => void;
  clearSelectedTheoryLesson: () => void;
  clearError: () => void;
}

export const useTheoryStore = create<TheoryState>((set, get) => ({
  theoryLessons: [],
  selectedTheoryLesson: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadTheoryLessons: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const theoryLessons = await theoryService.getTheoryLessons(filterBy);
      set({ theoryLessons, filterBy, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load theory lessons';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading theory lessons:', err);
    }
  },

  loadTheoryLessonById: async (theoryLessonId) => {
    set({ isLoading: true, error: null });
    try {
      const theoryLesson = await theoryService.getTheoryLessonById(theoryLessonId);
      set({ selectedTheoryLesson: theoryLesson, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load theory lesson';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading theory lesson:', err);
    }
  },

  loadTheoryLessonsByCategory: async (category, filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const theoryLessons = await theoryService.getTheoryLessonsByCategory(
        category,
        filterBy
      );
      set({ theoryLessons, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load category theory lessons';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading category theory lessons:', err);
    }
  },

  loadTheoryLessonsByTeacher: async (teacherId, filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const theoryLessons = await theoryService.getTheoryLessonsByTeacher(
        teacherId,
        filterBy
      );
      set({ theoryLessons, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load teacher theory lessons';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading teacher theory lessons:', err);
    }
  },

  saveTheoryLesson: async (theoryLessonToSave) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure schoolYearId is present
      if (!theoryLessonToSave.schoolYearId) {
        // Try to get it from the school year store
        const schoolYearStore = useSchoolYearStore.getState();
        const schoolYearId = schoolYearStore.currentSchoolYear?._id;

        if (!schoolYearId) {
          throw new Error('School year ID is required but not available');
        }

        theoryLessonToSave.schoolYearId = schoolYearId;
      }

      let savedTheoryLesson: TheoryLesson;

      if (theoryLessonToSave._id) {
        // Update existing theory lesson
        savedTheoryLesson = await theoryService.updateTheoryLesson(
          theoryLessonToSave._id,
          theoryLessonToSave
        );

        // Update in the theoryLessons array
        const updatedTheoryLessons = get().theoryLessons.map((t) =>
          t._id === savedTheoryLesson._id ? savedTheoryLesson : t
        );

        set({
          theoryLessons: updatedTheoryLessons,
          selectedTheoryLesson: savedTheoryLesson,
          isLoading: false,
        });
      } else {
        // Add new theory lesson
        console.log('Adding new theory lesson with data:', theoryLessonToSave);
        savedTheoryLesson = await theoryService.addTheoryLesson(theoryLessonToSave);

        set({
          theoryLessons: [...get().theoryLessons, savedTheoryLesson],
          selectedTheoryLesson: savedTheoryLesson,
          isLoading: false,
        });
      }

      return savedTheoryLesson;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save theory lesson';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving theory lesson:', err);
      throw err;
    }
  },

  removeTheoryLesson: async (theoryLessonId) => {
    set({ isLoading: true, error: null });
    try {
      if (!theoryLessonId) {
        throw new Error('Invalid theory lesson ID');
      }

      // Make the API call for hard deletion
      await theoryService.removeTheoryLesson(theoryLessonId);

      // Remove from state immediately after successful deletion
      // This is a permanent deletion, so we filter out the lesson completely
      set({
        theoryLessons: get().theoryLessons.filter((t) => t._id !== theoryLessonId),
        selectedTheoryLesson:
          get().selectedTheoryLesson?._id === theoryLessonId
            ? null
            : get().selectedTheoryLesson,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to permanently delete theory lesson';
      set({ error: errorMessage, isLoading: false });
      console.error('Error deleting theory lesson:', err);
      throw err;
    }
  },

  bulkCreateTheoryLessons: async (data) => {
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
            'School year ID is required for bulk theory lesson creation but not available'
          );
        }

        data.schoolYearId = schoolYearId;
      }

      console.log('Using school year ID for bulk create:', data.schoolYearId);

      // Validate required fields
      if (!data.category) {
        throw new Error('Category is required for bulk theory lesson creation');
      }

      if (!data.teacherId) {
        throw new Error('Teacher ID is required for bulk theory lesson creation');
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
      const formattedData: BulkTheoryLessonData = {
        category: data.category,
        teacherId: data.teacherId,
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        studentIds: data.studentIds || [],
        notes: data.notes || '',
        syllabus: data.syllabus || '',
        excludeDates: data.excludeDates || [],
        schoolYearId: data.schoolYearId,
      };

      console.log('Formatted data for bulk create:', formattedData);

      // Execute API call
      const result = await theoryService.bulkCreateTheoryLessons(formattedData);
      console.log('Bulk create result:', result);

      // After bulk creating, refresh the theory lesson list
      if (formattedData.category) {
        await get().loadTheoryLessonsByCategory(formattedData.category);
      } else if (formattedData.teacherId) {
        await get().loadTheoryLessonsByTeacher(formattedData.teacherId);
      } else {
        await get().loadTheoryLessons();
      }

      set({ isLoading: false });
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create bulk theory lessons';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating bulk theory lessons:', err);
      throw err;
    }
  },

  updateAttendance: async (theoryLessonId, attendance) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheoryLesson = await theoryService.updateAttendance(
        theoryLessonId,
        attendance
      );

      // Update in the theoryLessons array
      const updatedTheoryLessons = get().theoryLessons.map((t) =>
        t._id === theoryLessonId ? updatedTheoryLesson : t
      );

      set({
        theoryLessons: updatedTheoryLessons,
        selectedTheoryLesson:
          get().selectedTheoryLesson?._id === theoryLessonId
            ? updatedTheoryLesson
            : get().selectedTheoryLesson,
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

  addStudentToTheory: async (theoryLessonId, studentId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheoryLesson = await theoryService.addStudentToTheory(
        theoryLessonId,
        studentId
      );

      // Update in the theoryLessons array
      const updatedTheoryLessons = get().theoryLessons.map((t) =>
        t._id === theoryLessonId ? updatedTheoryLesson : t
      );

      set({
        theoryLessons: updatedTheoryLessons,
        selectedTheoryLesson:
          get().selectedTheoryLesson?._id === theoryLessonId
            ? updatedTheoryLesson
            : get().selectedTheoryLesson,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add student to theory lesson';
      set({ error: errorMessage, isLoading: false });
      console.error('Error adding student to theory lesson:', err);
      throw err;
    }
  },

  removeStudentFromTheory: async (theoryLessonId, studentId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheoryLesson = await theoryService.removeStudentFromTheory(
        theoryLessonId,
        studentId
      );

      // Update in the theoryLessons array
      const updatedTheoryLessons = get().theoryLessons.map((t) =>
        t._id === theoryLessonId ? updatedTheoryLesson : t
      );

      set({
        theoryLessons: updatedTheoryLessons,
        selectedTheoryLesson:
          get().selectedTheoryLesson?._id === theoryLessonId
            ? updatedTheoryLesson
            : get().selectedTheoryLesson,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove student from theory lesson';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing student from theory lesson:', err);
      throw err;
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } });
  },

  clearSelectedTheoryLesson: () => {
    set({ selectedTheoryLesson: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));