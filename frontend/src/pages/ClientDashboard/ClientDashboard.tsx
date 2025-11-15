import { Navigate, Outlet } from 'react-router-dom';
import ClientSidebar from '../../components/dashboard/ClientSidebar';
import { useAppSelector } from '../../hooks/redux';
import type { RootState } from '../../app/store';

const ClientDashboard = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <ClientSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 min-h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

