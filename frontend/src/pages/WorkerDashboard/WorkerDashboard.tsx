import { Navigate, Outlet } from 'react-router-dom';
import WorkerSidebar from '../../components/dashboard/WorkerSidebar';
import { useAppSelector } from '../../hooks/redux';

const WorkerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user?.role !== 'worker') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <WorkerSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 min-h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;

