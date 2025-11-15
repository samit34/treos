import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import axiosInstance from '../../api/axiosInstance';
import { User, Job, Payment } from '../../types';

type AdminJob = Job & { _id: string };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [jobCompletionMessage, setJobCompletionMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, jobsRes, paymentsRes] = await Promise.all([
        axiosInstance.get('/admin/dashboard/stats'),
        axiosInstance.get('/users/all'),
        axiosInstance.get('/admin/jobs'),
        axiosInstance.get('/admin/payments'),
      ]);

      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users);
      setJobs(jobsRes.data.data.jobs);
      setPayments(paymentsRes.data.data.payments);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleMarkJobComplete = async (jobId: string) => {
    const confirmComplete = window.confirm('Mark this job as completed?');
    if (!confirmComplete) {
      return;
    }

    try {
      setJobCompletionMessage('');
      setCompletingJobId(jobId);
      await axiosInstance.post(`/jobs/${jobId}/complete`);
      setJobCompletionMessage('Job marked as completed.');
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Failed to mark job as completed:', error);
      setJobCompletionMessage(error?.response?.data?.message || 'Unable to mark job as completed.');
    } finally {
      setCompletingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.firstName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {jobCompletionMessage && (
                <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {jobCompletionMessage}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalJobs || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.inProgressJobs || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                  <div className="space-y-2">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job._id} className="space-y-2 border-b py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-gray-500">Status: {job.status}</p>
                          </div>
                          {job.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleMarkJobComplete(job._id)}
                              disabled={completingJobId === job._id}
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {completingJobId === job._id ? 'Marking…' : 'Mark Completed'}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Client: {job.client?.firstName} {job.client?.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

