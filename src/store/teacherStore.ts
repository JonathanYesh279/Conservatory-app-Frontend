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
  dataInitialized: boolean;

  // Actions
  loadTeachers: (filterBy?: TeacherFilter) => Promise<Teacher[]>;
  loadBasicTeacherData: () => Promise<void>;
  loadTeacherById: (teacherId: string) => Promise<Teacher | null>;
  loadTeacherByRole: (role: string) => Promise<Teacher[]>; // Added function
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

  // Method to load basic teacher data for the entire app
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

  // New method to load teachers by role
  loadTeacherByRole: async (role: string): Promise<Teacher[]> => {
    console.log(`Loading teachers with role: ${role}`);
    set({ isLoading: true, error: null });
    try {
      // First check if we can find teachers with this role in the store
      const cachedTeachers = get().teachers.filter(
        (teacher) =>
          teacher.roles && teacher.roles.includes(role) && teacher.isActive
      );

      // If we have cached teachers with this role, use them
      if (cachedTeachers.length > 0) {
        console.log(
          `Found ${cachedTeachers.length} cached teachers with role ${role}`
        );
        set({ isLoading: false });
        return cachedTeachers;
      }

      // Otherwise, fetch from API
      console.log(`Fetching teachers with role ${role} from API`);
      const teachers = await teacherService.getTeachersByRole(role);

      // Update our local cache with these teachers
      const currentTeachers = get().teachers;
      const mergedTeachers = [...currentTeachers];

      teachers.forEach((newTeacher) => {
        const existingIndex = mergedTeachers.findIndex(
          (t) => t._id === newTeacher._id
        );
        if (existingIndex >= 0) {
          mergedTeachers[existingIndex] = newTeacher;
        } else {
          mergedTeachers.push(newTeacher);
        }
      });

      set({ teachers: mergedTeachers, isLoading: false });
      return teachers;
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Failed to load teachers with role ${role}`;
      set({ error: errorMsg, isLoading: false });
      console.error(`Error loading teachers with role ${role}:`, err);
      return [];
    }
  },

  loadTeacherById: async (teacherId: string): Promise<Teacher | null> => {
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

      if (teacher) {
        // Add null check
        const index = updatedTeachers.findIndex((t) => t._id === teacher._id);
        if (index >= 0) {
          updatedTeachers[index] = teacher;
        } else {
          updatedTeachers.push(teacher);
        }
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

      // IMPORTANT FIX: Always clear the selectedTeacher after saving
      // This ensures the form will be empty for new teachers
      set({
        teachers,
        selectedTeacher: null, // Clear the selected teacher
        isLoading: false,
      });

      console.log('Teacher saved successfully, cleared selectedTeacher');
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
    console.log(
      'Setting selected teacher:',
      teacher?.personalInfo?.fullName || 'null'
    );
    set({ selectedTeacher: teacher });
  },

  clearError: () => {
    set({ error: null });
  },

  clearSelectedTeacher: () => {
    console.log('Clearing selected teacher');
    set({ selectedTeacher: null });
  },
}));
