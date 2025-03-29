import { create } from 'zustand'
import { httpService } from '../services/httpService'

export interface SchoolYear {
  _id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SchoolYearState {
  schoolYears: SchoolYear[]
  currentSchoolYear: SchoolYear | null
  isLoading: boolean
  error: string | null

  // Actions
  loadSchoolYears: () => Promise<void>
  loadCurrentSchoolYear: () => Promise<void>
}

export const useSchoolYearStore = create<SchoolYearState>((set) => ({
  schoolYears: [],
  currentSchoolYear: null,
  isLoading: false,
  error: null,

  loadSchoolYears: async () => {
    set({ isLoading: true, error: null })
    try {
      const schoolYears = await httpService.get('school-year')
      set({ schoolYears, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load school years'
      set({ error: errorMessage, isLoading: false })
      console.error('Error loading school years:', err)
    }
  },

  loadCurrentSchoolYear: async () => {
    set({ isLoading: true, error: null })
    try {
      const currentSchoolYear = await httpService.get('school-year/current')
      set({ currentSchoolYear, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load current school year'
      set({ error: errorMessage, isLoading: false })
      console.error('Error loading current school year:', err)
    }
  }
})) 