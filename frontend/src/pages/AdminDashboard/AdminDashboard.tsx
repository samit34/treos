import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { User, Job, Payment } from '../../types';
import { adminApi } from '../../api/adminApi';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import OverviewTab from './components/OverviewTab';
import UsersTab from './components/UsersTab';
import CategoriesTab from './components/CategoriesTab';
import PaymentsTab from './components/PaymentsTab';
import MessagesTab from './components/MessagesTab';
import JobsTab from './components/JobsTab';

type AdminJob = Job & { _id: string };

const AdminDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; description?: string; isActive: boolean }>>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [jobCompletionMessage, setJobCompletionMessage] = useState('');

  // Get active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'Users';
    if (path.includes('/jobs')) return 'Jobs';
    if (path.includes('/categories')) return 'Categories';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/messages')) return 'Messages';
    return 'Overview';
  };

  const activeTab = getActiveTabFromPath();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, jobsRes, paymentsRes] = await Promise.all([
        axiosInstance.get('/admin/dashboard/stats'),
        axiosInstance.get('/users/all'),
        axiosInstance.get('/admin/jobs?limit=1000'), // Get all jobs
        axiosInstance.get('/admin/payments?limit=1000'), // Get all payments
      ]);

      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users);
      setJobs(jobsRes.data.data.jobs);
      setPayments(paymentsRes.data.data.payments);

      // load categories
      const cats = await adminApi.listCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Manage users, categories, payments, and more</p>
            </div>

            <div className="flex items-center gap-3 mb-6 overflow-x-auto">
              <Link
                to="/admindashboard/overview"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Overview' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Overview
              </Link>
              <Link
                to="/admindashboard/users"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Users' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admindashboard/jobs"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Jobs' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Jobs
              </Link>
              <Link
                to="/admindashboard/categories"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Categories' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Categories
              </Link>
              <Link
                to="/admindashboard/payments"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Payments' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Payments
              </Link>
              <Link
                to="/admindashboard/messages"
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  activeTab === 'Messages' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'
                }`}
              >
                Messages
              </Link>
            </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              {activeTab === 'Overview' && (
                <OverviewTab
                  stats={stats}
                  users={users}
                  jobs={jobs}
                  onMarkJobComplete={handleMarkJobComplete}
                  completingJobId={completingJobId}
                  jobCompletionMessage={jobCompletionMessage}
                />
              )}

              {activeTab === 'Users' && (
                <UsersTab users={users} onUsersUpdate={setUsers} />
              )}

              {activeTab === 'Jobs' && (
                <JobsTab jobs={jobs} onJobsUpdate={setJobs} />
              )}

              {activeTab === 'Categories' && (
                <CategoriesTab categories={categories} onCategoriesUpdate={setCategories} />
              )}

              {activeTab === 'Payments' && <PaymentsTab payments={payments} />}

              {activeTab === 'Messages' && <MessagesTab users={users} />}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
