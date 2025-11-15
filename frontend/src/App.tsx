import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import { useAuth } from './hooks/useAuth';
import { useChatSocket } from './hooks/useChatSocket';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding/Onboarding';
import ClientDashboard from './pages/ClientDashboard/ClientDashboard';
import DashboardHome from './pages/ClientDashboard/DashboardHome';
import JobsPage from './pages/ClientDashboard/JobsPage';
import CalendarPage from './pages/ClientDashboard/CalendarPage';
import AccountPage from './pages/ClientDashboard/AccountPage';
import WorkerDashboard from './pages/WorkerDashboard/WorkerDashboard';
import ClientProfilePage from './pages/WorkerDashboard/ClientProfilePage';
import WorkerOverviewPage from './pages/WorkerDashboard/WorkerOverviewPage';
import WorkerJobsPage from './pages/WorkerDashboard/WorkerJobsPage';
import WorkerAccountPage from './pages/WorkerDashboard/WorkerAccountPage';
import WorkerProposalsPage, {
  WorkerPendingProposalsPage,
} from './pages/WorkerDashboard/WorkerProposalsPage';
import WorkerCalendarPage from './pages/WorkerDashboard/WorkerCalendarPage';
import ClientPostJobPage from './pages/ClientDashboard/ClientPostJobPage';
import WorkerDirectoryPage from './pages/ClientDashboard/WorkerDirectoryPage';
import WorkerProfilePage from './pages/ClientDashboard/WorkerProfilePage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ChatPage from './pages/Chat/ChatPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ClientSettingsPage from './pages/Settings/ClientSettingsPage';
import WorkerSettingsPage from './pages/Settings/WorkerSettingsPage';
import ClientReviewsPage from './pages/Reviews/ClientReviewsPage';
import WorkerReviewsPage from './pages/Reviews/WorkerReviewsPage';
import ChatNotifications from './components/chat/ChatNotifications';

function App() {
  useAuth(); // Fetch user profile if authenticated
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  useChatSocket();

  const loadingScreen = (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <span className="text-sm font-medium text-gray-500">Loading your dashboard...</span>
    </div>
  );

  return (
    <>
      <ChatNotifications />
      <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            {user === null
              ? loadingScreen
              : user.onboardingCompleted
              ? <Navigate to="/dashboard" replace />
              : <Onboarding />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user === null ? (
              loadingScreen
            ) : !user.onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : user.role === 'client' ? (
              <ClientDashboard />
            ) : user.role === 'worker' ? (
              <WorkerDashboard />
            ) : user.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            user?.role === 'worker' ? <WorkerOverviewPage /> : <DashboardHome />
          }
        />
        <Route
          path="jobs"
          element={user?.role === 'worker' ? <WorkerJobsPage /> : <JobsPage />}
        />
        <Route
          path="jobs/post"
          element={
            user?.role === 'client' ? <ClientPostJobPage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="workers"
          element={
            user?.role === 'client' ? <WorkerDirectoryPage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="workers/:workerId"
          element={
            user?.role === 'client' ? <WorkerProfilePage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="clients/:clientId"
          element={
            user?.role === 'worker' ? <ClientProfilePage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="settings"
          element={
            user?.role === 'client' ? (
              <ClientSettingsPage />
            ) : user?.role === 'worker' ? (
              <WorkerSettingsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="reviews"
          element={
            user?.role === 'client' ? (
              <ClientReviewsPage />
            ) : user?.role === 'worker' ? (
              <WorkerReviewsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="calendar"
          element={
            user?.role === 'worker' ? <WorkerCalendarPage /> : <CalendarPage />
          }
        />
        <Route
          path="account"
          element={user?.role === 'worker' ? <WorkerAccountPage /> : <AccountPage />}
        />
        <Route
          path="chat"
          element={
            user?.role === 'client' || user?.role === 'worker' ? (
              <ChatPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="proposals"
          element={
            user?.role === 'worker' ? <WorkerProposalsPage /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="proposals/pending"
          element={
            user?.role === 'worker' ? (
              <WorkerPendingProposalsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Route>
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard/chat" replace />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;

