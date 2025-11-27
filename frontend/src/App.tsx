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
        element={
          isAuthenticated ? (
            <Navigate
              to={
                user?.role === 'client'
                  ? '/clientdashboard'
                  : user?.role === 'worker'
                  ? '/workerdashboard'
                  : user?.role === 'admin'
                  ? '/admindashboard'
                  : '/login'
              }
              replace
            />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate
              to={
                user?.role === 'client'
                  ? '/clientdashboard'
                  : user?.role === 'worker'
                  ? '/workerdashboard'
                  : user?.role === 'admin'
                  ? '/admindashboard'
                  : '/login'
              }
              replace
            />
          ) : (
            <Signup />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            {user === null
              ? loadingScreen
              : user.onboardingCompleted
              ? (
                  <Navigate
                    to={
                      user.role === 'client'
                        ? '/clientdashboard'
                        : user.role === 'worker'
                        ? '/workerdashboard'
                        : user.role === 'admin'
                        ? '/admindashboard'
                        : '/login'
                    }
                    replace
                  />
                )
              : <Onboarding />}
          </ProtectedRoute>
        }
      />
      {/* Legacy /dashboard route - redirect to appropriate dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user === null ? (
              loadingScreen
            ) : !user.onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : user.role === 'client' ? (
              <Navigate to="/clientdashboard" replace />
            ) : user.role === 'worker' ? (
              <Navigate to="/workerdashboard" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admindashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Client Dashboard Routes */}
      <Route
        path="/clientdashboard"
        element={
          <ProtectedRoute>
            {user === null ? (
              loadingScreen
            ) : !user.onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : user.role === 'client' ? (
              <ClientDashboard />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route
          path="jobs"
          element={
            user?.role === 'client' ? <JobsPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="jobs/post"
          element={
            user?.role === 'client' ? <ClientPostJobPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="workers"
          element={
            user?.role === 'client' ? <WorkerDirectoryPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="workers/:workerId"
          element={
            user?.role === 'client' ? <WorkerProfilePage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="settings"
          element={
            user?.role === 'client' ? (
              <ClientSettingsPage />
            ) : (
              <Navigate to="/clientdashboard" replace />
            )
          }
        />
        <Route
          path="reviews"
          element={
            user?.role === 'client' ? (
              <ClientReviewsPage />
            ) : (
              <Navigate to="/clientdashboard" replace />
            )
          }
        />
        <Route
          path="calendar"
          element={
            user?.role === 'client' ? <CalendarPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="account"
          element={
            user?.role === 'client' ? <AccountPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="chat"
          element={
            user?.role === 'client' ? <ChatPage /> : <Navigate to="/clientdashboard" replace />
          }
        />
        <Route
          path="proposals/pending"
          element={
            user?.role === 'worker' ? (
              <WorkerPendingProposalsPage />
            ) : (
              <Navigate to="/workerdashboard" replace />
            )
          }
        />
      </Route>

      {/* Worker Dashboard Routes */}
      <Route
        path="/workerdashboard"
        element={
          <ProtectedRoute>
            {user === null ? (
              loadingScreen
            ) : !user.onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : user.role === 'worker' ? (
              <WorkerDashboard />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkerOverviewPage />} />
        <Route
          path="jobs"
          element={
            user?.role === 'worker' ? <WorkerJobsPage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="clients/:clientId"
          element={
            user?.role === 'worker' ? <ClientProfilePage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="settings"
          element={
            user?.role === 'worker' ? (
              <WorkerSettingsPage />
            ) : (
              <Navigate to="/workerdashboard" replace />
            )
          }
        />
        <Route
          path="reviews"
          element={
            user?.role === 'worker' ? (
              <WorkerReviewsPage />
            ) : (
              <Navigate to="/workerdashboard" replace />
            )
          }
        />
        <Route
          path="calendar"
          element={
            user?.role === 'worker' ? <WorkerCalendarPage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="account"
          element={
            user?.role === 'worker' ? <WorkerAccountPage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="chat"
          element={
            user?.role === 'worker' ? <ChatPage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="proposals"
          element={
            user?.role === 'worker' ? <WorkerProposalsPage /> : <Navigate to="/workerdashboard" replace />
          }
        />
        <Route
          path="proposals/pending"
          element={
            user?.role === 'worker' ? (
              <WorkerPendingProposalsPage />
            ) : (
              <Navigate to="/workerdashboard" replace />
            )
          }
        />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route
        path="/admindashboard"
        element={
          <ProtectedRoute>
            {user === null ? (
              loadingScreen
            ) : !user.onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : user.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admindashboard/overview" replace />} />
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="jobs" element={<AdminDashboard />} />
        <Route path="categories" element={<AdminDashboard />} />
        <Route path="payments" element={<AdminDashboard />} />
        <Route path="messages" element={<AdminDashboard />} />
      </Route>

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            {user?.role === 'client' ? (
              <Navigate to="/clientdashboard/chat" replace />
            ) : user?.role === 'worker' ? (
              <Navigate to="/workerdashboard/chat" replace />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <Navigate
            to={
              user?.role === 'client'
                ? '/clientdashboard'
                : user?.role === 'worker'
                ? '/workerdashboard'
                : user?.role === 'admin'
                ? '/admindashboard'
                : '/login'
            }
            replace
          />
        }
      />
      </Routes>
    </>
  );
}

export default App;

