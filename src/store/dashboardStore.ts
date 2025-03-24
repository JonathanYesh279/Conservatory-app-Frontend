// src/store/dashboardStore.ts
import { create } from 'zustand'
import { dashboardService, DashboardStats } from '../services/dashboardService'

interface DashboardState {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
}

// Default empty stats
const initialStats: DashboardStats = {
  students: { total: 0 },
  teachers: { total: 0 },
  orchestras: { total: 0 },
  rehearsals: { total: 0, practiceHours: 0 },
  attendance: { total: 0 }
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,
  
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null })
    try {
      const stats = await dashboardService.getDashboardStats()
      set({ stats, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats'
      set({ error: errorMessage, isLoading: false })
      console.error('Error fetching dashboard stats:', err)
    }
  },
  
  clearError: () => set({ error: null })
}))