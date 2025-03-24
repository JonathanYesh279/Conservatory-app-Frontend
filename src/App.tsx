import './styles/main.scss'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './hooks/useTheme'

import { Dashboard } from './pages/Dashboard'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// Protected route component
function ProtectedRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)  
  const isLoading = useAuthStore(state => state.isLoading)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) { 
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Add more routes for the navigation */}
              <Route path="/students" element={<div>Students Page</div>} />
              <Route path="/orchestras" element={<div>Orchestras Page</div>} />
              <Route path="/calendar" element={<div>Calendar Page</div>} />
              <Route path="/stats" element={<div>Stats Page</div>} />
              <Route path="/profile" element={<div>Profile Page</div>} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App