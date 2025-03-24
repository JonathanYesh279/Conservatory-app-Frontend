// src/store/studentStore.ts
import { create } from 'zustand'
import { Student, StudentFilter, studentService } from '../services/studentService'

interface StudentState {
  students: Student[]
  selectedStudent: Student | null
  filterBy: StudentFilter
  isLoading: boolean
  error: string | null

  // Actions
  loadStudents: (filterBy?: StudentFilter) => Promise<void>
  loadStudentById: (studentId: string) => Promise<void>
  saveStudent: (student: Partial<Student>) => Promise<Student>
  removeStudent: (studentId: string) => Promise<void>
  setFilter: (filterBy: Partial<StudentFilter>) => void
  clearSelectedStudent: () => void
  clearError: () => void
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  selectedStudent: null,
  filterBy: {},
  isLoading: false,
  error: null,

  loadStudents: async (filterBy = {}) => {
    set({ isLoading: true, error: null })
    try {
      const newFilterBy = { ...get().filterBy, ...filterBy }
      const students = await studentService.getStudents(newFilterBy)
      set({ students, filterBy: newFilterBy, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students'
      set({ error: errorMessage, isLoading: false })
      console.error('Error loading students:', err)
    }
  },

  loadStudentById: async (studentId) => {
    set({ isLoading: true, error: null })
    try {
      const student = await studentService.getStudentById(studentId)
      set({ selectedStudent: student, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load student'
      set({ error: errorMessage, isLoading: false })
      console.error('Error loading student:', err)
    }
  },

  saveStudent: async (studentToSave) => {
    set({ isLoading: true, error: null })
    try {
      let savedStudent: Student
      
      if (studentToSave._id) {
        // Update existing student
        savedStudent = await studentService.updateStudent(
          studentToSave._id,
          studentToSave
        )
        
        // Update in the students array
        const updatedStudents = get().students.map(s => 
          s._id === savedStudent._id ? savedStudent : s
        )
        
        set({ 
          students: updatedStudents, 
          selectedStudent: savedStudent,
          isLoading: false 
        })
      } else {
        // Add new student
        savedStudent = await studentService.addStudent(studentToSave)
        
        set({ 
          students: [...get().students, savedStudent],
          selectedStudent: savedStudent, 
          isLoading: false 
        })
      }
      
      return savedStudent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save student'
      set({ error: errorMessage, isLoading: false })
      console.error('Error saving student:', err)
      throw err
    }
  },

  removeStudent: async (studentId) => {
    set({ isLoading: true, error: null })
    try {
      await studentService.removeStudent(studentId)
      
      set({ 
        students: get().students.filter(s => s._id !== studentId),
        selectedStudent: get().selectedStudent?._id === studentId ? null : get().selectedStudent,
        isLoading: false 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove student'
      set({ error: errorMessage, isLoading: false })
      console.error('Error removing student:', err)
      throw err
    }
  },

  setFilter: (filterBy) => {
    set({ filterBy: { ...get().filterBy, ...filterBy } })
  },

  clearSelectedStudent: () => {
    set({ selectedStudent: null })
  },

  clearError: () => {
    set({ error: null })
  }
}))