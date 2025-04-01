// src/store/teacherStore.ts
import { create } from 'zustand';
import {
  Teacher,
  TeacherFilter,
  teacherService,
} from '../services/teacherService';

interface TeacherState {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
  filterBy: TeacherFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTeachers: (filterBy?: TeacherFilter) => Promise<void>;
  loadTeacherById: (teacherId: string) => Promise<void>;
  saveTeacher: (
    teacher: Partial<Teacher>,
    teacherId?: string
  ) => Promise<Teacher>;
  removeTeacher: (teacherId: string) => Promise<void>;
  setFilter: (filterBy: Partial<TeacherFilter>) => void;
  clearSelectedTeacher: () => void;
  clearError: () => void;

  // Additional actions for more complex operations
  updateTeacherSchedule: (
    teacherId: string,
    scheduleData: any
  ) => Promise<void>;
  assignStudentToTeacher: (
    teacherId: string,
    studentId: string
  ) => Promise<void>;
  removeStudentFromTeacher: (
    teacherId: string,
    studentId: string
  ) => Promise<void>;
  assignOrchestraToTeacher: (
    teacherId: string,
    orchestraId: string
  ) => Promise<void>;
  removeOrchestraFromTeacher: (
    teacherId: string,
    orchestraId: string
  ) => Promise<void>;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  selectedTeacher: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadTeachers: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const newFilterBy = { ...get().filterBy, ...filterBy };
      const teachers = await teacherService.getTeachers(newFilterBy);
      set({ teachers, filterBy: newFilterBy, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load teachers';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading teachers:', err);
    }
  },

  loadTeacherById: async (teacherId) => {
    set({ isLoading: true, error: null });
    try {
      const teacher = await teacherService.getTeacherById(teacherId);
      set({ selectedTeacher: teacher, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading teacher:', err);
    }
  },

  saveTeacher: async (teacherToSave, teacherId) => {
    set({ isLoading: true, error: null });
    try {
      let savedTeacher: Teacher;

      if (teacherId) {
        // Update existing teacher - pass teacherId as a separate parameter
        savedTeacher = await teacherService.updateTeacher(
          teacherId,
          teacherToSave
        );

        // Update in the teachers array
        const updatedTeachers = get().teachers.map((t) =>
          t._id === savedTeacher._id ? savedTeacher : t
        );

        set({
          teachers: updatedTeachers,
          selectedTeacher: savedTeacher,
          isLoading: false,
        });
      } else {
        // Add new teacher
        savedTeacher = await teacherService.addTeacher(teacherToSave);

        set({
          teachers: [...get().teachers, savedTeacher],
          selectedTeacher: savedTeacher,
          isLoading: false,
        });
      }

      return savedTeacher;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving teacher:', err);
      throw err;
    }
  },

  removeTeacher: async (teacherId) => {
    set({ isLoading: true, error: null });
    try {
      await teacherService.removeTeacher(teacherId);

      set({
        teachers: get().teachers.filter((t) => t._id !== teacherId),
        selectedTeacher:
          get().selectedTeacher?._id === teacherId
            ? null
            : get().selectedTeacher,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing teacher:', err);
      throw err;
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } });
  },

  clearSelectedTeacher: () => {
    set({ selectedTeacher: null });
  },

  clearError: () => {
    set({ error: null });
  },

  // Update teacher schedule (lessons)
  updateTeacherSchedule: async (teacherId, scheduleData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTeacher = await teacherService.updateTeacherSchedule(
        teacherId,
        scheduleData
      );

      // Update in state if this is the selected teacher
      if (get().selectedTeacher?._id === teacherId) {
        set({ selectedTeacher: updatedTeacher });
      }

      // Update in the teachers array
      const updatedTeachers = get().teachers.map((t) =>
        t._id === teacherId ? updatedTeacher : t
      );

      set({
        teachers: updatedTeachers,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update teacher schedule';
      set({ error: errorMessage, isLoading: false });
      console.error('Error updating teacher schedule:', err);
      throw err;
    }
  },

  // Assign student to teacher
  assignStudentToTeacher: async (teacherId, studentId) => {
    set({ isLoading: true, error: null });
    try {
      // This operation would typically need to be implemented in your teacherService
      // For now we're assuming it adds the student to the teacher's studentIds array
      const updatedTeacher = await teacherService.updateTeacher(teacherId, {
        teaching: {
          ...get().selectedTeacher?.teaching,
          studentIds: [
            ...(get().selectedTeacher?.teaching?.studentIds || []),
            studentId,
          ],
        },
      });

      // Update in state if this is the selected teacher
      if (get().selectedTeacher?._id === teacherId) {
        set({ selectedTeacher: updatedTeacher });
      }

      // Update in the teachers array
      const updatedTeachers = get().teachers.map((t) =>
        t._id === teacherId ? updatedTeacher : t
      );

      set({
        teachers: updatedTeachers,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to assign student to teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error assigning student to teacher:', err);
      throw err;
    }
  },

  // Remove student from teacher
  removeStudentFromTeacher: async (teacherId, studentId) => {
    set({ isLoading: true, error: null });
    try {
      // This operation would typically need to be implemented in your teacherService
      const selectedTeacher = get().selectedTeacher;
      if (!selectedTeacher || !selectedTeacher.teaching) {
        throw new Error('Teacher not found or no teaching data');
      }

      const updatedStudentIds = selectedTeacher.teaching.studentIds.filter(
        (id) => id !== studentId
      );

      const updatedTeacher = await teacherService.updateTeacher(teacherId, {
        teaching: {
          ...selectedTeacher.teaching,
          studentIds: updatedStudentIds,
        },
      });

      // Update in state if this is the selected teacher
      if (get().selectedTeacher?._id === teacherId) {
        set({ selectedTeacher: updatedTeacher });
      }

      // Update in the teachers array
      const updatedTeachers = get().teachers.map((t) =>
        t._id === teacherId ? updatedTeacher : t
      );

      set({
        teachers: updatedTeachers,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to remove student from teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing student from teacher:', err);
      throw err;
    }
  },

  // Assign orchestra to teacher (as conductor)
  assignOrchestraToTeacher: async (teacherId, orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      // Assuming a method exists to add an orchestra to a teacher's conducting.orchestraIds
      const updatedTeacher = await teacherService.addOrchestra(
        teacherId,
        orchestraId
      );

      // Update in state if this is the selected teacher
      if (get().selectedTeacher?._id === teacherId) {
        set({ selectedTeacher: updatedTeacher });
      }

      // Update in the teachers array
      const updatedTeachers = get().teachers.map((t) =>
        t._id === teacherId ? updatedTeacher : t
      );

      set({
        teachers: updatedTeachers,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to assign orchestra to teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error assigning orchestra to teacher:', err);
      throw err;
    }
  },

  // Remove orchestra from teacher
  removeOrchestraFromTeacher: async (teacherId, orchestraId) => {
    set({ isLoading: true, error: null });
    try {
      // Assuming a method exists to remove an orchestra from a teacher's conducting.orchestraIds
      const updatedTeacher = await teacherService.removeOrchestra(
        teacherId,
        orchestraId
      );

      // Update in state if this is the selected teacher
      if (get().selectedTeacher?._id === teacherId) {
        set({ selectedTeacher: updatedTeacher });
      }

      // Update in the teachers array
      const updatedTeachers = get().teachers.map((t) =>
        t._id === teacherId ? updatedTeacher : t
      );

      set({
        teachers: updatedTeachers,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to remove orchestra from teacher';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing orchestra from teacher:', err);
      throw err;
    }
  },
}));
