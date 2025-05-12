// src/store/teacherStore.ts
import { create } from 'zustand';
import {
  teacherService,
  Teacher,
  TeacherFilter,
} from '../services/teacherService';

interface TeacherState {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
  isLoading: boolean;
  error: string | null;
  dataInitialized: boolean; // New flag to track if data has been initialized

  // Actions
  loadTeachers: (filterBy?: TeacherFilter) => Promise<Teacher[]>;
  loadBasicTeacherData: () => Promise<void>; // New method to load essential data
  loadTeacherById: (teacherId: string) => Promise<Teacher>;
  saveTeacher: (
    teacher: Partial<Teacher>,
    teacherId?: string
  ) => Promise<Teacher>;
  removeTeacher: (teacherId: string) => Promise<void>;
  setSelectedTeacher: (teacher: Teacher | null) => void;
  clearError: () => void;
  clearSelectedTeacher: () => void;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  selectedTeacher: null,
  isLoading: false,
  error: null,
  dataInitialized: false,

  loadTeachers: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const teachers = await teacherService.getTeachers(filterBy);
      set({ teachers, isLoading: false, dataInitialized: true });
      return teachers;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load teachers';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  // New method to load basic teacher data for the entire app
  loadBasicTeacherData: async () => {
    // Only load if not already initialized
    if (get().dataInitialized) return;

    console.log('Initializing basic teacher data...');
    set({ isLoading: true, error: null });
    try {
      // Load all active teachers with minimal fields
      const teachers = await teacherService.getTeachers({ isActive: true });
      set({ teachers, isLoading: false, dataInitialized: true });
      console.log(`Loaded ${teachers.length} teachers successfully`);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to load essential teacher data';
      set({ error: errorMsg, isLoading: false });
      console.error('Teacher data initialization failed:', errorMsg);
    }
  },

  loadTeacherById: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      // First check if this teacher is already in the store
      const existingTeacher = get().teachers.find((t) => t._id === teacherId);
      if (existingTeacher) {
        set({ selectedTeacher: existingTeacher, isLoading: false });
        return existingTeacher;
      }

      // If not found, fetch from the server
      const teacher = await teacherService.getTeacherById(teacherId);

      // Update the teachers array with this teacher
      const updatedTeachers = [...get().teachers];
      const index = updatedTeachers.findIndex((t) => t._id === teacher._id);
      if (index >= 0) {
        updatedTeachers[index] = teacher;
      } else {
        updatedTeachers.push(teacher);
      }

      set({
        selectedTeacher: teacher,
        teachers: updatedTeachers,
        isLoading: false,
      });
      return teacher;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load teacher';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  saveTeacher: async (teacher: Partial<Teacher>, teacherId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let savedTeacher;

      if (teacherId) {
        savedTeacher = await teacherService.updateTeacher(teacherId, teacher);
      } else {
        savedTeacher = await teacherService.addTeacher(teacher);
      }

      // Update the teachers array
      const teachers = [...get().teachers];
      const index = teachers.findIndex((t) => t._id === savedTeacher._id);

      if (index >= 0) {
        teachers[index] = savedTeacher;
      } else {
        teachers.push(savedTeacher);
      }

      set({
        teachers,
        selectedTeacher: savedTeacher,
        isLoading: false,
      });

      return savedTeacher;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to save teacher';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  removeTeacher: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      await teacherService.removeTeacher(teacherId);

      // Update the teachers array
      const teachers = get().teachers.filter((t) => t._id !== teacherId);

      set({
        teachers,
        selectedTeacher:
          get().selectedTeacher?._id === teacherId
            ? null
            : get().selectedTeacher,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to remove teacher';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  setSelectedTeacher: (teacher) => {
    set({ selectedTeacher: teacher });
  },

  clearError: () => {
    set({ error: null });
  },

  clearSelectedTeacher: () => {
  set({ selectedTeacher: null });
},
}));
