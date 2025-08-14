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
<<<<<<< Updated upstream
  // Track local stage changes that haven't been persisted to backend
  localStageChanges: Record<string, Record<string, number>>; // studentId -> instrumentName -> stage
=======
>>>>>>> Stashed changes

  // Actions
  loadStudents: (filterBy?: StudentFilter) => Promise<void>;
  loadStudentById: (studentId: string) => Promise<void>;
  saveStudent: (student: Partial<Student>) => Promise<Student>;
  removeStudent: (studentId: string) => Promise<void>;
  getStudentsByIds: (studentIds: string[]) => Promise<Student[]>
  setFilter: (filterBy: Partial<StudentFilter>) => void;
  clearSelectedStudent: () => void;
  clearError: () => void;
<<<<<<< Updated upstream
  updateStudentStage: (studentId: string, instrumentName: string, newStage: number) => void;
}

// Helper function to apply local stage changes to a student
const applyLocalStageChanges = (student: Student, localChanges: Record<string, Record<string, number>>): Student => {
  const studentChanges = localChanges[student._id];
  if (!studentChanges || Object.keys(studentChanges).length === 0) {
    return student;
  }

  return {
    ...student,
    academicInfo: {
      ...student.academicInfo,
      instrumentProgress: student.academicInfo.instrumentProgress.map(instrument => {
        const localStage = studentChanges[instrument.instrumentName];
        if (localStage !== undefined) {
          return { ...instrument, currentStage: localStage };
        }
        return instrument;
      })
    }
  };
};

=======
}

>>>>>>> Stashed changes
export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  selectedStudent: null,
  filterBy: {},
  isLoading: false,
  error: null,
<<<<<<< Updated upstream
  localStageChanges: {},
=======
>>>>>>> Stashed changes

  loadStudents: async (filterBy = {}) => {
    set({ isLoading: true, error: null });
    try {
      const newFilterBy = { ...get().filterBy, ...filterBy };
      const students = await studentService.getStudents(newFilterBy);
<<<<<<< Updated upstream
      
      // Apply local stage changes to preserve local updates
      const currentState = get();
      const studentsWithLocalChanges = students.map(student => 
        applyLocalStageChanges(student, currentState.localStageChanges)
      );
      
      set({ students: studentsWithLocalChanges, filterBy: newFilterBy, isLoading: false });
=======
      set({ students, filterBy: newFilterBy, isLoading: false });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      
      // Apply local stage changes to preserve local updates
      const currentState = get();
      const studentWithLocalChanges = applyLocalStageChanges(student, currentState.localStageChanges);
      
      set({ selectedStudent: studentWithLocalChanges, isLoading: false });
=======
      set({ selectedStudent: student, isLoading: false });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

  updateStudentStage: (studentId: string, instrumentName: string, newStage: number) => {
    const currentState = get();
    
    // Track this change in localStageChanges
    const updatedLocalStageChanges = {
      ...currentState.localStageChanges,
      [studentId]: {
        ...currentState.localStageChanges[studentId],
        [instrumentName]: newStage
      }
    };
    
    // Update the student in the students array
    const updatedStudents = currentState.students.map(student => {
      if (student._id === studentId) {
        return {
          ...student,
          academicInfo: {
            ...student.academicInfo,
            instrumentProgress: student.academicInfo.instrumentProgress.map(instrument => {
              if (instrument.instrumentName === instrumentName) {
                return { ...instrument, currentStage: newStage };
              }
              return instrument;
            })
          }
        };
      }
      return student;
    });

    // Update the selected student if it matches
    let updatedSelectedStudent = currentState.selectedStudent;
    if (currentState.selectedStudent && currentState.selectedStudent._id === studentId) {
      updatedSelectedStudent = {
        ...currentState.selectedStudent,
        academicInfo: {
          ...currentState.selectedStudent.academicInfo,
          instrumentProgress: currentState.selectedStudent.academicInfo.instrumentProgress.map(instrument => {
            if (instrument.instrumentName === instrumentName) {
              return { ...instrument, currentStage: newStage };
            }
            return instrument;
          })
        }
      };
    }

    set({
      students: updatedStudents,
      selectedStudent: updatedSelectedStudent,
      localStageChanges: updatedLocalStageChanges
    });

    console.log(`Updated stage in student store: ${instrumentName} -> ${newStage} for student ${studentId}`);
    console.log('Local stage changes:', updatedLocalStageChanges);
  },
=======
>>>>>>> Stashed changes
}));
