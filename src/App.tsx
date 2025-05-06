// src/App.tsx
import './styles/main.scss';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useTeacherStore } from './store/teacherStore'; // Import teacher store
import { ThemeProvider } from './hooks/useTheme';
import { EventRegistrationForm } from './cmps/EventRegistrationForm';
import { useEffect } from 'react';

import { Dashboard } from './pages/Dashboard.tsx';
import { StudentIndex } from './pages/StudentIndex.tsx';
import { StudentDetails } from './pages/StudentDetails.tsx';
import { TeacherIndex } from './pages/TeacherIndex.tsx';
import { TeacherDetails } from './pages/TeacherDetails.tsx';
import { OrchestraIndex } from './pages/OrchestraIndex.tsx';
import { OrchestraDetails } from './pages/OrchestraDetails.tsx';
import { RehearsalIndex } from './pages/RehearsalIndex.tsx';
import { RehearsalDetails } from './pages/RehearsalDetails.tsx';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route component with data preloading
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loadBasicTeacherData = useTeacherStore(
    (state) => state.loadBasicTeacherData
  );

  // Preload essential data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadBasicTeacherData();
    }
  }, [isAuthenticated, loadBasicTeacherData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path='/login' element={<LoginPage />} />
            <Route
              path='/event-registration'
              element={<EventRegistrationForm />}
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />

              {/* Student routes */}
              <Route path='/students' element={<StudentIndex />}>
                <Route path=':studentId' element={<StudentDetails />} />
                <Route path='new' element={<StudentDetails />} />
              </Route>

              {/* Teacher routes */}
              <Route path='/teachers' element={<TeacherIndex />}>
                <Route path=':teacherId' element={<TeacherDetails />} />
                <Route path='new' element={<TeacherDetails />} />
              </Route>

              {/* Orchestra routes */}
              <Route path='/orchestras' element={<OrchestraIndex />}>
                <Route path=':orchestraId' element={<OrchestraDetails />} />
                <Route path='new' element={<OrchestraDetails />} />
              </Route>

              {/* Rehearsal routes */}
              <Route path='/rehearsals' element={<RehearsalIndex />}>
                <Route path=':rehearsalId' element={<RehearsalDetails />} />
                <Route path='new' element={<RehearsalDetails />} />
              </Route>

              {/* Default route inside protected area */}
              <Route path='/' element={<Navigate to='/dashboard' replace />} />
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
