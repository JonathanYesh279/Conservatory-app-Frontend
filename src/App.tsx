import './styles/main.scss'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore.ts'

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

// Dashboard placeholder component
function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more protected routes here */}
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App