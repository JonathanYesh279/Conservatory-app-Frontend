import './styles/main.scss'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './hooks/useTheme'
import { EventRegistrationForm } from './cmps/EventRegistrationForm'

import { Dashboard } from './pages/Dashboard'
import { StudentIndex } from './pages/StudentIndex.tsx'
import { StudentDetails } from './pages/StudentDetails.tsx'
import { TeacherIndex } from './pages/TeacherIndex.tsx'
import { TeacherDetails } from './pages/TeacherDetails.tsx'

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
            <Route path='/login' element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />

              {/* Student routes - nested pattern */}
              <Route path='/students' element={<StudentIndex />}>
                {/* Child routes for StudentIndex */}
                <Route path=':studentId' element={<StudentDetails />} />
                <Route path='new' element={<StudentDetails />} />
              </Route>

              {/* Teacher routes - nested pattern */}
              <Route path='/teachers' element={<TeacherIndex />}>
                {/* Child routes for TeacherIndex */}
                <Route path=':teacherId' element={<TeacherDetails />} />
                <Route path='new' element={<TeacherDetails />} />
              </Route>

              <Route path='/orchestras' element={<div>Orchestras Page</div>} />
              <Route path='/calendar' element={<div>Calendar Page</div>} />
              <Route path='/profile' element={<div>Profile Page</div>} />
            </Route>

            {/* Event registration route */}
            <Route
              path='/event-registration'
              element={<EventRegistrationForm />}
            />

            {/* Default redirect */}
            <Route path='/' element={<Navigate to='/dashboard' replace />} />
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App