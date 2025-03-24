// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { dashboardService, DashboardStats } from '../services/dashboardService'

export function useDashboard() {
  const query = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getAllDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}