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
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useTeacherStore } from './store/teacherStore'; // Import teacher store
import { ThemeProvider } from './hooks/useTheme';
import { EventRegistrationForm } from './cmps/EventRegistrationForm';
import { useEffect } from 'react';
import { ToastProvider } from './cmps/Toast';
import ToastTest from './cmps/Toast/ToastTest';
import './utils/debugUtils'; // Import debug utils for development

import { Dashboard } from './pages/Dashboard.tsx';
import { StudentIndex } from './pages/StudentIndex.tsx';
import { StudentDetails } from './pages/StudentDetails.tsx';
import { TeacherIndex } from './pages/TeacherIndex.tsx';
import { TeacherDetails } from './pages/TeacherDetails.tsx';
import { OrchestraIndex } from './pages/OrchestraIndex.tsx';
import { OrchestraDetails } from './pages/OrchestraDetails.tsx';
import { RehearsalIndex } from './pages/RehearsalIndex.tsx';
import { RehearsalDetails } from './pages/RehearsalDetails.tsx';
import { TheoryIndex } from './pages/TheoryIndex.tsx';
import { TheoryDetails } from './pages/TheoryDetails.tsx';
import { UserProfile } from './pages/UserProfile.tsx';
import { ResetPassword } from './pages/ResetPassword.tsx';

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
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const loadBasicTeacherData = useTeacherStore(
    (state) => state.loadBasicTeacherData
  );

  // Preload essential data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadBasicTeacherData();
    }
  }, [isAuthenticated, loadBasicTeacherData]);

  // Show loading while validating session
  if (!isInitialized || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Validating session...
      </div>
    );
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
        <ToastProvider position="bottom-left">
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path='/login' element={<LoginPage />} />
              <Route path='/reset-password/:token' element={<ResetPassword />} />
              <Route path='/accept-invitation/:token' element={<AcceptInvitationPage />} />
              <Route
                path='/event-registration'
                element={<EventRegistrationForm />}
              />
              <Route
                path='/toast-test'
                element={<ToastTest />}
              />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/profile' element={<UserProfile />} />

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

              {/* Theory routes - Not nested for direct navigation */}
              <Route path='/theory' element={<TheoryIndex />} />
              <Route path='/theory/:theoryLessonId' element={<TheoryDetails />} />
              <Route path='/theory/new' element={<TheoryDetails />} />

              {/* Default route inside protected area */}
              <Route path='/' element={<Navigate to='/theory' replace />} />
              <Route path='*' element={<Navigate to='/theory' replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
