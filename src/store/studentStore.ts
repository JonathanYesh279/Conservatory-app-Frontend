// src/store/studentStore.ts
import { create } from 'zustand';
import {
  Student,
  StudentFilter,
  studentService,
} from '../services/studentService';
import { teacherService } from '../services/teacherService';

interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
  filterBy: StudentFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStudents: (filterBy?: StudentFilter) => Promise<void>;
  loadStudentById: (studentId: string) => Promise<void>;
  saveStudent: (student: Partial<Student>) => Promise<Student>;
  removeStudent: (studentId: string) => Promise<void>;
  getStudentsByIds: (studentIds: string[]) => Promise<Student[]>
  setFilter: (filterBy: Partial<StudentFilter>) => void;
  clearSelectedStudent: () => void;
  clearError: () => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  selectedStudent: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadStudents: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const newFilterBy = { ...get().filterBy, ...filterBy };
      const students = await studentService.getStudents(newFilterBy);
      set({ students, filterBy: newFilterBy, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load students';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading students:', err);
    }
  },

  loadStudentById: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const student = await studentService.getStudentById(studentId);
      set({ selectedStudent: student, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load student';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading student:', err);
    }
  },

  saveStudent: async (studentToSave) => {
    set({ isLoading: true, error: null });
    try {
      let savedStudent: Student;

      if (studentToSave._id) {
        // Update existing student
        // We need to create a copy to avoid modifying the original object
        const studentId = studentToSave._id;

        // Only send fields that need to be updated
        savedStudent = await studentService.updateStudent(
          studentId,
          studentToSave
        );

        // Update in the students array
        const updatedStudents = get().students.map((s) =>
          s._id === savedStudent._id ? savedStudent : s
        );

        set({
          students: updatedStudents,
          selectedStudent: savedStudent,
          isLoading: false,
        });
      } else {
        // Add new student
        savedStudent = await studentService.addStudent(studentToSave);

        set({
          students: [...get().students, savedStudent],
          selectedStudent: savedStudent,
          isLoading: false,
        });
      }

      return savedStudent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save student';
      set({ error: errorMessage, isLoading: false });
      console.error('Error saving student:', err);
      throw err;
    }
  },

  removeStudent: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      // Get the student details to find associated teachers
      const student = get().students.find(s => s._id === studentId) || get().selectedStudent;
      const teacherIds = student?.teacherIds || [];
      
      // First, remove student from all associated teachers
      if (teacherIds.length > 0) {
        const teacherPromises = teacherIds.map(teacherId => 
          teacherService.removeStudentFromTeacher(teacherId, studentId)
            .catch(err => {
              console.error(`Failed to remove student ${studentId} from teacher ${teacherId}:`, err);
              // Continue with other teachers even if one fails
              return null;
            })
        );
        
        // Wait for all teacher updates to complete
        await Promise.allSettled(teacherPromises);
      }
      
      // Then remove the student
      await studentService.removeStudent(studentId);

      set({
        students: get().students.filter((s) => s._id !== studentId),
        selectedStudent:
          get().selectedStudent?._id === studentId
            ? null
            : get().selectedStudent,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove student';
      set({ error: errorMessage, isLoading: false });
      console.error('Error removing student:', err);
      throw err;
    }
  },

  getStudentsByIds: async (studentIds) => {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    set({ isLoading: true, error: null });
    try {
      // Try to get from existing students in store first
      const storeState = get();
      const cachedStudents = storeState.students;

      // Find which students we already have in cache
      const cachedStudentIds = cachedStudents.map((s) => s._id);
      const missingStudentIds = studentIds.filter(
        (id) => !cachedStudentIds.includes(id)
      );

      let allStudents = [...cachedStudents];

      // Only fetch the missing students
      if (missingStudentIds.length > 0) {
        const fetchedStudents = await studentService.getStudentsByIds(
          missingStudentIds
        );

        // Merge with existing students without duplication
        allStudents = [...cachedStudents];

        // Add only the new students
        fetchedStudents.forEach((student) => {
          if (!allStudents.some((s) => s._id === student._id)) {
            allStudents.push(student);
          }
        });

        // Update the store's students
        set({ students: allStudents });
      }

      // Filter out just the requested students
      const requestedStudents = allStudents.filter((student) =>
        studentIds.includes(student._id)
      );

      set({ isLoading: false });
      return requestedStudents;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load students by IDs';
      set({ error: errorMessage, isLoading: false });
      console.error('Error loading students by IDs:', err);
      return [];
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } });
  },

  clearSelectedStudent: () => {
    set({ selectedStudent: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
